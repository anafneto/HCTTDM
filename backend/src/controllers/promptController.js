const axios = require('axios');
const { users } = require('../models');

const EXTERNAL_SERVICE_URL = 'http://192.168.0.5:5000/meu_servico';

exports.sendPrompt = async (req, res) => {
  try {
    const { q, context, userId } = req.body;

    if (!q || q.trim() === '') {
      return res.status(400).json({
        message: 'Question (q) is required'
      });
    }

    console.log('=== REQUEST ===');
    console.log('Question:', q);
    console.log('Context:', context);
    console.log('UserId:', userId);

    let userContext = "";
    let enhancedQuestion = q;

    if (userId) {
      try {
        const user = await users.findByPk(userId);

        console.log('=== USER DATA FETCHED ===');
        if (user) {
          console.log('User found:', {
            id: user.id,
            name: user.name,
            email: user.email,
            region: user.region,
            grade_level: user.grade_level,
            date_of_birth: user.date_of_birth,
            other_special_need: user.other_special_need
          });

          userContext = buildUserContext(user);

          enhancedQuestion = `${q}\n\n[Remember to follow the student profile instructions provided in the context]`;

          console.log('=== USER CONTEXT BUILT ===');
          console.log(userContext);
        } else {
          console.log('User not found with ID:', userId);
        }
      } catch (error) {
        console.error('=== ERROR FETCHING USER DATA ===');
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
    } else {
      console.log('No userId provided in request');
    }

    const finalContext = [
      userContext,
      context || ""
    ].filter(Boolean).join('\n\n');

    console.log('=== FINAL CONTEXT TO SEND ===');
    console.log(finalContext);
    console.log('=== ENHANCED QUESTION ===');
    console.log(enhancedQuestion);
    console.log('=== SENDING TO EXTERNAL SERVICE ===');

    const response = await axios.post(
      EXTERNAL_SERVICE_URL,
      {
        q: enhancedQuestion,
        context: finalContext
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        responseType: 'text',
        timeout: 120000
      }
    );

    console.log('=== EXTERNAL SERVICE RESPONSE ===');
    console.log('Status:', response.status);
    console.log('Data:', response.data);

    let result = response.data;

    try {
      const parsed = JSON.parse(result);
      if (parsed && typeof parsed === 'object' && 'resposta' in parsed) {
        result = parsed.resposta;
        console.log('Extracted "resposta" field:', result);
      }
    } catch (e) {
      console.log('Response is not JSON or does not have "resposta" field');
    }

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.json({
      content: result,
      format: 'markdown',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('=== ERROR CALLING EXTERNAL SERVICE ===');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);

    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      res.status(error.response.status).json({
        message: 'External service error',
        error: error.response.data
      });
    } else if (error.request) {
      console.error('No response received from external service');
      res.status(503).json({
        message: 'Cannot reach external service',
        error: error.message
      });
    } else {
      console.error('Error setting up request:', error.message);
      res.status(500).json({
        message: 'Internal server error',
        error: error.message
      });
    }
  }
};

exports.processAnnotation = async (req, res) => {
  try {
    const { text, type, context, userId } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({
        message: 'Text is required'
      });
    }

    if (!type || !['summarize', 'unfamiliar'].includes(type)) {
      return res.status(400).json({
        message: 'Type must be "summarize" or "unfamiliar"'
      });
    }

    console.log('=== PROCESS ANNOTATION REQUEST ===');
    console.log('Text:', text);
    console.log('Type:', type);
    console.log('Context:', context);
    console.log('UserId:', userId);

    let userContext = "";
    if (userId) {
      try {
        const user = await users.findByPk(userId);
        if (user) {
          userContext = buildUserContext(user);
          console.log('User context built for annotation');
        }
      } catch (error) {
        console.error('Error fetching user for annotation:', error.message);
      }
    }

    let prompt = "";
    if (type === "summarize") {
      prompt = `Summarize the following text. Keep it brief and clear:\n\n"${text}"\n\n[Follow the student profile instructions in the context]`;
    } else if (type === "unfamiliar") {
      prompt = `Explain what this means in simple terms:\n\n"${text}"\n\n[Adapt explanation to student's level as specified in the context]`;
    }

    const fullContext = [userContext, context].filter(Boolean).join('\n\n');

    console.log('=== ANNOTATION PROMPT ===');
    console.log(prompt);
    console.log('=== ANNOTATION CONTEXT ===');
    console.log(fullContext);

    const response = await axios.post(
      EXTERNAL_SERVICE_URL,
      {
        q: prompt,
        context: fullContext
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        responseType: 'text',
        timeout: 120000
      }
    );

    console.log('=== ANNOTATION RESPONSE ===');
    console.log('Status:', response.status);

    let result = response.data;

    try {
      const parsed = JSON.parse(result);
      if (parsed && typeof parsed === 'object' && 'resposta' in parsed) {
        result = parsed.resposta;
      }
    } catch (e) {
    }

    res.json({
      text: text,
      type: type,
      content: result
    });

  } catch (error) {
    console.error('=== ERROR PROCESSING ANNOTATION ===');
    console.error('Error message:', error.message);

    if (error.response) {
      res.status(error.response.status).json({
        message: 'External service error',
        error: error.response.data
      });
    } else if (error.request) {
      res.status(503).json({
        message: 'Cannot reach external service',
        error: error.message
      });
    } else {
      res.status(500).json({
        message: 'Internal server error',
        error: error.message
      });
    }
  }
};

exports.consolidateKnowledge = async (req, res) => {
  try {
    const { collectedItems, context, userId } = req.body;

    if (!collectedItems || collectedItems.length === 0) {
      return res.status(400).json({ error: 'No items to consolidate' });
    }

    console.log('=== CONSOLIDATE REQUEST ===');
    console.log('Collected Items Count:', collectedItems.length);
    console.log('UserId:', userId);

    let userContext = "";
    if (userId) {
      try {
        const user = await users.findByPk(userId);
        if (user) {
          userContext = buildUserContext(user);
          console.log('User context built for consolidation');
        }
      } catch (error) {
        console.error('Error fetching user for consolidation:', error.message);
      }
    }

    const prompt = `Based on the following knowledge items that the user has collected and marked as important, create a well-structured, cohesive text that consolidates all this information into a comprehensive summary.

        Collected Knowledge Items:
        ${collectedItems.map((item, i) => `${i + 1}. ${item.text}`).join('\n')}

        Instructions:
        - Create a coherent, well-structured text that incorporates all collected items
        - Organize the information logically with clear sections
        - Maintain an educational tone
        - Add transitions between concepts
        - The text should be comprehensive but concise
        - Use markdown formatting for better readability (headings, bullet points, etc.)
        - Use exclusively the information from the collected items; do not add any external information.

        [Remember to follow the student profile instructions provided in the context]

        Generate the consolidated text:`;

    const fullContext = [userContext, context].filter(Boolean).join('\n\n');

    console.log('=== CONSOLIDATION PROMPT ===');
    console.log(prompt);

    const response = await axios.post(
      EXTERNAL_SERVICE_URL,
      {
        q: prompt,
        context: fullContext
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        responseType: 'text',
        timeout: 120000
      }
    );

    console.log('=== CONSOLIDATION RESPONSE ===');
    console.log('Status:', response.status);

    let result = response.data;

    try {
      const parsed = JSON.parse(result);
      if (parsed && typeof parsed === 'object' && 'resposta' in parsed) {
        result = parsed.resposta;
      }
    } catch (e) {
      console.log('Response is not JSON or does not have "resposta" field');
    }

    res.json({
      success: true,
      consolidatedText: result
    });

  } catch (error) {
    console.error('=== ERROR CONSOLIDATING KNOWLEDGE ===');
    console.error('Error message:', error.message);

    if (error.response) {
      res.status(error.response.status).json({
        message: 'External service error',
        error: error.response.data
      });
    } else if (error.request) {
      res.status(503).json({
        message: 'Cannot reach external service',
        error: error.message
      });
    } else {
      res.status(500).json({
        message: 'Internal server error',
        error: error.message
      });
    }
  }
};

function buildUserContext(user) {
  const contextParts = [];

  contextParts.push('=== MANDATORY INSTRUCTIONS ===');
  contextParts.push('YOU MUST follow these guidelines when responding:');
  contextParts.push('');

  if (user.region) {
    const languageMap = {
      'Portugal': 'Portuguese (Portugal)',
      'Brasil': 'Portuguese (Brazil)',
      'Spain': 'Spanish',
      'France': 'French',
      'Germany': 'German',
      'Italy': 'Italian',
      'UK': 'English (British)',
      'USA': 'English (American)'
    };

    const language = languageMap[user.region] || 'Portuguese';
    contextParts.push(`1. LANGUAGE: Respond ONLY in ${language}`);
  }

  if (user.grade_level) {
    const gradeMap = {
      '1ciclo': { name: '1st Cycle (ages 6-10)', complexity: 'very simple, use short sentences and basic vocabulary' },
      '2ciclo': { name: '2nd Cycle (ages 10-12)', complexity: 'simple, avoid complex terms' },
      '3ciclo': { name: '3rd Cycle (ages 12-15)', complexity: 'moderate, you can introduce some technical terms with explanations' },
      'secundario': { name: 'Secondary Education (ages 15-18)', complexity: 'intermediate, use proper academic vocabulary' },
      'superior': { name: 'Higher Education', complexity: 'advanced, use technical and academic language' }
    };

    const gradeInfo = gradeMap[user.grade_level] || { name: user.grade_level, complexity: 'moderate' };
    contextParts.push(`2. EDUCATION LEVEL: Student is in ${gradeInfo.name}`);
    contextParts.push(`   - Complexity: ${gradeInfo.complexity}`);
  }

  if (user.other_special_need && user.other_special_need.trim() !== '') {
    contextParts.push(`3. SPECIAL NEEDS: This student has ${user.other_special_need}`);
    contextParts.push('   YOU MUST adapt your response:');

    const specialNeedsLower = user.other_special_need.toLowerCase();

    if (specialNeedsLower.includes('adhd')) {
      contextParts.push('   ✓ Use ONLY short sentences (max 15 words)');
      contextParts.push('   ✓ Use bullet points and numbered lists');
      contextParts.push('   ✓ Break information into 3-5 small steps');
      contextParts.push('   ✓ Start with concrete examples before theory');
    }

    if (specialNeedsLower.includes('dyslexia') || specialNeedsLower.includes('dislexia')) {
      contextParts.push('   ✓ Use simple, common words (avoid complex vocabulary)');
      contextParts.push('   ✓ Keep paragraphs to 2-3 sentences maximum');
      contextParts.push('   ✓ Use analogies and visual descriptions');
      contextParts.push('   ✓ Avoid long, dense text blocks');
    }

    if (specialNeedsLower.includes('autism') || specialNeedsLower.includes('autismo')) {
      contextParts.push('   ✓ Be extremely literal and specific');
      contextParts.push('   ✓ NO metaphors, idioms, or abstract language');
      contextParts.push('   ✓ Use clear structure with headings');
      contextParts.push('   ✓ Provide step-by-step instructions');
    }

    if (specialNeedsLower.includes('dyscalculia') || specialNeedsLower.includes('discalculia')) {
      contextParts.push('   ✓ For math: use visual representations and diagrams');
      contextParts.push('   ✓ Show ALL calculation steps (never skip steps)');
      contextParts.push('   ✓ Use real-world examples and analogies');
      contextParts.push('   ✓ Relate numbers to tangible objects');
    }
  }

  if (user.date_of_birth) {
    const age = calculateAge(user.date_of_birth);
    if (age) {
      contextParts.push(`4. AGE: Student is ${age} years old - use age-appropriate examples and references`);
    }
  }

  contextParts.push('');
  contextParts.push('=== END OF MANDATORY INSTRUCTIONS ===');
  contextParts.push('');

  return contextParts.join('\n');
}

function calculateAge(birthDate) {
  try {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age > 0 ? age : null;
  } catch {
    return null;
  }
}
