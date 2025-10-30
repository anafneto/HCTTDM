import React from 'react';
import { authService } from '../services/api';

function ShipsSpecialNeeds() {
  const user = authService.getCurrentUser();

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getEducationLabel = (grade) => {
    switch (grade) {
      case '1ciclo': return '1st Cycle (1st-4th grade)';
      case '2ciclo': return '2nd Cycle (5th-6th grade)';
      case '3ciclo': return '3rd Cycle (7th-9th grade)';
      case 'secundario': return 'Secondary Education';
      case 'superior': return 'Higher Education';
      default: return grade;
    }
  };

  const specialNeeds = user?.other_special_need
    ? user.other_special_need.split(',').map(need => need.trim())
    : [];

  return (
    <div className="d-flex gap-2 mb-2 flex-wrap" style={{ maxWidth: '100%' }}>
      <div style={{ minWidth: '80px', width: 'fit-content' }}>
        <div style={{
          border: '1px solid #ddd',
          borderRadius: '25px',
          padding: '3px 12px',
          background: 'white',
          fontSize: '0.85rem',
          whiteSpace: 'nowrap'
        }}>
          <div className="d-flex align-items-center">
            <span className="text-muted me-2">Age:</span>
            <span style={{ fontWeight: 500 }}>
              {user?.date_of_birth ? calculateAge(user.date_of_birth) + "y" : "None"}
            </span>
          </div>
        </div>
      </div>

      <div style={{ minWidth: '80px', width: 'fit-content' }}>
        <div style={{
          border: '1px solid #ddd',
          borderRadius: '25px',
          padding: '3px 12px',
          background: 'white',
          fontSize: '0.85rem',
          whiteSpace: 'nowrap'
        }}>
          <div className="d-flex align-items-center">
            <span className="text-muted me-2">Education:</span>
            <span style={{ fontWeight: 500 }}>
              {user?.grade_level ? getEducationLabel(user.grade_level) : 'None'}
            </span>
          </div>
        </div>
      </div>

      <div style={{ minWidth: '100px', width: 'fit-content', maxWidth: '300px' }}>
        <div style={{ 
          border: '1px solid #ddd',
          borderRadius: '25px',
          padding: '3px 12px',
          background: 'white',
          fontSize: '0.85rem'
        }}>
          <div className="d-flex align-items-center flex-wrap">
            <span className="text-muted me-2">Special needs:</span>
            <span style={{ fontWeight: 500 }}>
              {specialNeeds.length > 0 ? specialNeeds.join(', ') : 'None'}
            </span>
          </div>
        </div>
      </div>

      <div style={{ minWidth: '80px', width: 'fit-content' }}>
        <div style={{
          border: '1px solid #ddd',
          borderRadius: '25px',
          padding: '3px 12px',
          background: 'white',
          fontSize: '0.85rem',
          whiteSpace: 'nowrap'
        }}>
          <div className="d-flex align-items-center">
            <span className="text-muted me-2">Region:</span>
            <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>
              {user?.region || 'None'}
            </span>
          </div>
        </div>
      </div>

      <div style={{ minWidth: '100px', width: 'fit-content', maxWidth: '300px' }}>
        <div style={{
          border: '1px solid #ddd',
          borderRadius: '25px',
          padding: '3px 12px',
          background: 'white',
          fontSize: '0.85rem'
        }}>
          <div className="d-flex align-items-center flex-wrap">
            <span className="text-muted me-2">Social or cultural context:</span>
            <span style={{ fontWeight: 500 }}>
              {user?.social_context || 'None'}
            </span>
          </div>
        </div>
      </div>

      

      
    </div>
  );
}

export default ShipsSpecialNeeds;
