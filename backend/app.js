require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./src/models/database');
const usersRoutes = require('./src/routes/usersRoutes');
const special_needRoutes = require('./src/routes/special_needRoutes');
const promptRoutes = require('./src/routes/promptRoutes'); 

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use('/api/users', usersRoutes);
app.use('/api/special-needs', special_needRoutes);
app.use('/api/prompt', promptRoutes); 

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
