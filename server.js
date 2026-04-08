const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'votes.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'));
}
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, '{}');
}

app.use(express.json());
app.use(express.static('public'));

// Get all votes
app.get('/api/votes', (req, res) => {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  res.json(data);
});

// Submit a vote
app.post('/api/votes', (req, res) => {
  const { voter, girl, ranks } = req.body;
  if (!voter || !girl || !ranks || ranks.length !== 10) {
    return res.status(400).json({ error: 'Invalid vote data' });
  }
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  data[voter] = { girl, ranks, submitted: new Date().toISOString() };
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  res.json({ status: 'ok', votes: data });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
