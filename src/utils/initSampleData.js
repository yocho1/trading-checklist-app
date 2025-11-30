// src/utils/initSampleData.js
export const initSampleData = () => {
  const existingData = localStorage.getItem('trading_app_shared_data')

  if (!existingData) {
    const sampleData = {
      users: [
        {
          id: '1',
          name: 'Demo User',
          email: 'demo@example.com',
          password: 'password123',
          isVerified: true,
          createdAt: new Date().toISOString(),
          authProvider: 'email',
        },
      ],
      verificationCodes: {},
      trades: [],
    }

    localStorage.setItem('trading_app_shared_data', JSON.stringify(sampleData))
    console.log('Sample data initialized')
  }
}

// Call this in your App.jsx
// initSampleData();
