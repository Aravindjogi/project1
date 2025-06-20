const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const os = require('os'); // For getting network interfaces
const app = express();
const port = 3000;
const host = '0.0.0.0'; // Listen on all interfaces

// Middleware
app.use(cors({ origin: '*' })); // Allow all origins for local testing
app.use(express.json());

// Serve static files (e.g., index.html)
app.use(express.static('.'));

// Data directory and JSON file paths
const DATA_DIR = path.join(__dirname, 'data');
const FILE_PATHS = {
  users: path.join(DATA_DIR, 'users.json'),
  ideas: path.join(DATA_DIR, 'ideas.json'),
  funds: path.join(DATA_DIR, 'funds.json'),
  votes: path.join(DATA_DIR, 'votes.json'),
  comments: path.join(DATA_DIR, 'comments.json'),
  chat_messages: path.join(DATA_DIR, 'chat_messages.json'),
  activity_log: path.join(DATA_DIR, 'activity_log.json')
};

// Initialize data directory and JSON files
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}
Object.values(FILE_PATHS).forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([]));
  }
});

// Helper functions for reading and writing JSON files
function readJsonFile(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return [];
  }
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing to ${filePath}:`, error);
    return false;
  }
}

// Function to get the laptop's IP address
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const iface of Object.values(interfaces)) {
    for (const config of iface) {
      if (config.family === 'IPv4' && !config.internal) {
        return config.address; // Return first non-internal IPv4 address
      }
    }
  }
  return 'unknown';
}

// Users endpoint
app.get('/users', (req, res) => {
  const users = readJsonFile(FILE_PATHS.users);
  res.json(users);
});

app.post('/users', (req, res) => {
  const users = readJsonFile(FILE_PATHS.users);
  const user = req.body;
  if (users.some(u => u.username === user.username)) {
    return res.json({ success: false, message: 'Username already exists' });
  }
  if (users.length >= 5000) {
    return res.json({ success: false, message: 'User limit reached' });
  }
  users.push(user);
  if (writeJsonFile(FILE_PATHS.users, users)) {
    res.json({ success: true });
  } else {
    res.json({ success: false, message: 'Failed to save user' });
  }
});

// Ideas endpoint
app.get('/ideas', (req, res) => {
  const ideas = readJsonFile(FILE_PATHS.ideas);
  res.json(ideas);
});

app.post('/ideas', (req, res) => {
  const ideas = readJsonFile(FILE_PATHS.ideas);
  const idea = req.body;
  if (ideas.some(i => i.title === idea.title)) {
    return res.json({ success: false, message: 'Idea title already exists' });
  }
  if (ideas.length >= 5000) {
    return res.json({ success: false, message: 'Idea limit reached' });
  }
  ideas.push(idea);
  if (writeJsonFile(FILE_PATHS.ideas, ideas)) {
    res.json({ success: true });
  } else {
    res.json({ success: false, message: 'Failed to save idea' });
  }
});

app.post('/ideas/edit', (req, res) => {
  const ideas = readJsonFile(FILE_PATHS.ideas);
  const { oldTitle, newTitle, description, creator, category, fundingGoal, status } = req.body;
  const index = ideas.findIndex(i => i.title === oldTitle);
  if (index === -1) {
    return res.json({ success: false, message: 'Idea not found' });
  }
  ideas[index] = { title: newTitle, description, creator, category, fundingGoal, status };
  if (writeJsonFile(FILE_PATHS.ideas, ideas)) {
    res.json({ success: true });
  } else {
    res.json({ success: false, message: 'Failed to update idea' });
  }
});

app.post('/ideas/delete', (req, res) => {
  const { title } = req.body;
  let ideas = readJsonFile(FILE_PATHS.ideas);
  const index = ideas.findIndex(i => i.title === title);
  if (index === -1) {
    return res.json({ success: false, message: 'Idea not found' });
  }
  ideas.splice(index, 1);
  let funds = readJsonFile(FILE_PATHS.funds).filter(f => f.ideaTitle !== title);
  let votes = readJsonFile(FILE_PATHS.votes).filter(v => v.ideaTitle !== title);
  let comments = readJsonFile(FILE_PATHS.comments).filter(c => c.ideaTitle !== title);
  let chatMessages = readJsonFile(FILE_PATHS.chat_messages).filter(m => m.ideaTitle !== title);
  const success = [
    writeJsonFile(FILE_PATHS.ideas, ideas),
    writeJsonFile(FILE_PATHS.funds, funds),
    writeJsonFile(FILE_PATHS.votes, votes),
    writeJsonFile(FILE_PATHS.comments, comments),
    writeJsonFile(FILE_PATHS.chat_messages, chatMessages)
  ].every(result => result);
  if (success) {
    res.json({ success: true });
  } else {
    res.json({ success: false, message: 'Failed to delete idea' });
  }
});

// Funds endpoint
app.get('/funds', (req, res) => {
  const funds = readJsonFile(FILE_PATHS.funds);
  res.json(funds);
});

app.post('/fund', (req, res) => {
  const funds = readJsonFile(FILE_PATHS.funds);
  const fund = req.body;
  funds.push(fund);
  if (writeJsonFile(FILE_PATHS.funds, funds)) {
    res.json({ success: true });
  } else {
    res.json({ success: false, message: 'Failed to save fund' });
  }
});

// Votes endpoint
app.get('/votes', (req, res) => {
  const votes = readJsonFile(FILE_PATHS.votes);
  res.json(votes);
});

app.post('/votes', (req, res) => {
  const votes = readJsonFile(FILE_PATHS.votes);
  const vote = req.body;
  if (votes.some(v => v.username === vote.username && v.ideaTitle === vote.ideaTitle)) {
    return res.json({ success: false, message: 'You have already voted' });
  }
  if (votes.length >= 5000) {
    return res.json({ success: false, message: 'Vote limit reached' });
  }
  votes.push(vote);
  if (writeJsonFile(FILE_PATHS.votes, votes)) {
    res.json({ success: true });
  } else {
    res.json({ success: false, message: 'Failed to save vote' });
  }
});

// Comments endpoint
app.get('/comments', (req, res) => {
  const comments = readJsonFile(FILE_PATHS.comments);
  res.json(comments);
});

app.post('/comments', (req, res) => {
  const comments = readJsonFile(FILE_PATHS.comments);
  const comment = req.body;
  if (comments.length >= 5000) {
    return res.json({ success: false, message: 'Comment limit reached' });
  }
  comments.push(comment);
  if (writeJsonFile(FILE_PATHS.comments, comments)) {
    res.json({ success: true });
  } else {
    res.json({ success: false, message: 'Failed to save comment' });
  }
});

app.post('/comments/delete', (req, res) => {
  const comments = readJsonFile(FILE_PATHS.comments);
  const { index } = req.body;
  if (index < 0 || index >= comments.length) {
    return res.json({ success: false, message: 'Comment not found' });
  }
  comments.splice(index, 1);
  if (writeJsonFile(FILE_PATHS.comments, comments)) {
    res.json({ success: true });
  } else {
    res.json({ success: false, message: 'Failed to delete comment' });
  }
});

// Chat messages endpoint
app.get('/chat_messages', (req, res) => {
  const chatMessages = readJsonFile(FILE_PATHS.chat_messages);
  res.json(chatMessages);
});

app.post('/chat_messages', (req, res) => {
  const chatMessages = readJsonFile(FILE_PATHS.chat_messages);
  const message = req.body;
  if (chatMessages.length >= 5000) {
    return res.json({ success: false, message: 'Chat message limit reached' });
  }
  chatMessages.push(message);
  if (writeJsonFile(FILE_PATHS.chat_messages, chatMessages)) {
    res.json({ success: true });
  } else {
    res.json({ success: false, message: 'Failed to save chat message' });
  }
});

// Activity log endpoint
app.get('/activity_log', (req, res) => {
  const activityLog = readJsonFile(FILE_PATHS.activity_log);
  res.json(activityLog);
});

app.post('/activity_log', (req, res) => {
  const activityLog = readJsonFile(FILE_PATHS.activity_log);
  const activity = req.body;
  activityLog.push(activity);
  if (writeJsonFile(FILE_PATHS.activity_log, activityLog)) {
    res.json({ success: true });
  } else {
    res.json({ success: false, message: 'Failed to save activity log' });
  }
});

// Analytics endpoint
app.get('/analytics', (req, res) => {
  const data = {
    users: readJsonFile(FILE_PATHS.users),
    ideas: readJsonFile(FILE_PATHS.ideas),
    funds: readJsonFile(FILE_PATHS.funds),
    votes: readJsonFile(FILE_PATHS.votes),
    comments: readJsonFile(FILE_PATHS.comments),
    chatMessages: readJsonFile(FILE_PATHS.chat_messages),
    activityLog: readJsonFile(FILE_PATHS.activity_log)
  };
  res.json(data);
});

// Start the server and log the IP
app.listen(port, host, () => {
  const ip = getLocalIP();
  console.log(`Server running on http://${ip}:${port}`);
});