const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/assessment-tools';

async function recreateTestUser() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Connected to MongoDB');
    
    // Создаем тестовое мероприятие если его нет
    const Event = mongoose.model('Event', new mongoose.Schema({
      name: String,
      status: String,
      votingEnabled: Boolean
    }));
    
    let event = await Event.findOne();
    if (!event) {
      event = await Event.create({
        name: 'Tatar san',
        status: 'draft',
        votingEnabled: false
      });
      console.log('Test event created:', event.name);
    }
    
    console.log('Database initialized successfully');
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

recreateTestUser();

