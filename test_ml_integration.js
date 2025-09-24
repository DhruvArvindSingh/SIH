const fetch = require('node-fetch');

// Test data
const testData = {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJpYXQiOjE3NTg2OTk3NDB9.cQT_T6s6tIoHDantF8OsQz5Eyv7R1fPXE7K1fiUVwo0',
    content: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAgACADASIAAhEBAxEB/8QAGQAAAwEBAQAAAAAAAAAAAAAAAAQFAwEC/8QAJRAAAQQCAgEEAwEAAAAAAAAAAQACEQMhBBITMUFRYXEiwdH/xAAVAQEBAAAAAAAAAAAAAAAAAAACA//EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/ANvDc3xCxY02m8a+SvMtLW+Tfy5+V1C8rQ8b2AcxGsb8Ic/XEcJlpqKf/9k=', // Small test image
    city: 'Test City',
    district: 'Test District',
    coordinates: {
        latitude: 12.9716,
        longitude: 77.5946
    },
    locationDetails: {
        city: 'Test City',
        district: 'Test District',
        roadName: 'Test Road',
        state: 'Karnataka',
        country: 'India',
        postalCode: '560001',
        neighborhood: 'Test Area',
        landmark: 'Test Landmark',
        placeId: 'test-place-id',
        formattedAddress: 'Test Road, Test Area, Test City, Karnataka 560001, India',
        addressComponents: [],
        placeTypes: ['route', 'political']
    }
};

async function testMLIntegration() {
    try {
        console.log('🧪 Testing ML Integration...');
        console.log('📡 FastAPI Server Status:', await checkMLServer());
        console.log('🏥 HTTP Server Status:', await checkHTTPServer());

        console.log('\n📤 Sending test pothole report...');

        const response = await fetch('http://localhost:3001/api/v1/pothole', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData)
        });

        const result = await response.json();

        console.log('\n📝 Response Status:', response.status);
        console.log('📄 Response Body:', JSON.stringify(result, null, 2));

        if (result.data && result.data.mlDetection) {
            console.log('\n🎯 ML Detection Results:');
            console.log('- Total Detections:', result.data.mlDetection.totalDetections);
            console.log('- Priority:', result.data.mlDetection.priority);
            console.log('- Average Confidence:', result.data.mlDetection.avgConfidence);
            console.log('- Detections:', result.data.mlDetection.detections.length > 0 ?
                result.data.mlDetection.detections.map(d => `${d.class} (${d.confidence.toFixed(3)})`).join(', ') :
                'None'
            );
        } else {
            console.log('\n⚠️  No ML detection results in response');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

async function checkMLServer() {
    try {
        const response = await fetch('http://localhost:8000/');
        return response.ok ? '✅ Running' : '❌ Not responding';
    } catch (error) {
        return '❌ Not accessible';
    }
}

async function checkHTTPServer() {
    try {
        const response = await fetch('http://localhost:3001/health');
        return response.ok ? '✅ Running' : '❌ Not responding';
    } catch (error) {
        return '❌ Not accessible';
    }
}

// Run the test
testMLIntegration();
