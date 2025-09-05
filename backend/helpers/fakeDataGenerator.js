// Helper functions for generating fake data

// Generate realistic marketing stats
const generateMarketingStats = () => {
  // Generate realistic-looking stats with some randomness
  const totalUsers = Math.floor(Math.random() * 1000000) + 9000000; // 9-10 million
  const dailyActiveUsers = Math.floor(Math.random() * 100000) + 900000; // 900k-1 million
  const totalWithdrawn = Math.floor(Math.random() * 5000000) + 95000000; // 9.5-10 crore
  const successRate = (Math.random() * 2 + 96.5).toFixed(1); // 96.5-98.5%
  const averageRating = (Math.random() * 0.5 + 4.4).toFixed(1); // 4.4-4.9
  const totalReviews = Math.floor(Math.random() * 5000) + 20000; // 20k-25k
  
  return {
    totalUsers,
    dailyActiveUsers,
    totalWithdrawn,
    successRate,
    averageRating,
    totalReviews
  };
};

// Generate fake withdrawal for popup
const generateFakeWithdrawal = () => {
  const names = [
    "Rahul Sharma", "Priya Patel", "Amit Kumar", "Sneha Gupta", 
    "Vikas Singh", "Pooja Verma", "Rajesh Mehta", "Anita Desai",
    "Suresh Reddy", "Kavita Nair", "Deepak Joshi", "Meena Iyer",
    "Sanjay Malhotra", "Neha Kapoor", "Manoj Tiwari", "Swati Bansal",
    "Arjun Rao", "Divya Pillai", "Rohan Khanna", "Tanvi Choudhury"
  ];
  
  const randomName = names[Math.floor(Math.random() * names.length)];
  const amount = Math.floor(Math.random() * 9500) + 500; // ₹500-₹10,000
  const timestamp = new Date().toLocaleTimeString();
  
  return {
    name: randomName,
    amount: amount,
    timestamp: timestamp
  };
};

// Export functions
module.exports = {
  generateMarketingStats,
  generateFakeWithdrawal
};