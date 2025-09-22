from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
import json
import requests

app = Flask(__name__)
CORS(app)

# Configure API keys from environment
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEOAPIFY_API_KEY = os.getenv("GEOAPIFY_API_KEY")

if not GEMINI_API_KEY:
    print("❌ GEMINI_API_KEY is not set!")
    print("📝 To fix this:")
    print("1. Get your API key from: https://aistudio.google.com/")
    print("2. Set it in PowerShell: $env:GEMINI_API_KEY='your_api_key_here'")
    print("3. Or set it in Command Prompt: set GEMINI_API_KEY=your_api_key_here")
    raise RuntimeError("GEMINI_API_KEY is not set. Please set it in your environment.")

if not GEOAPIFY_API_KEY:
    print("⚠️  GEOAPIFY_API_KEY is not set!")
    print("📝 To fix this:")
    print("1. Get your API key from: https://www.geoapify.com/get-started-with-maps-api/")
    print("2. Set it in PowerShell: $env:GEOAPIFY_API_KEY='your_api_key_here'")
    print("3. Or set it in Command Prompt: set GEOAPIFY_API_KEY=your_api_key_here")
    print("⚠️  Location-based college suggestions will be disabled without this key.")

genai.configure(api_key=GEMINI_API_KEY)


def find_nearby_colleges(latitude, longitude, radius_km=30, limit=10):
    """
    Find nearby educational institutions using Geoapify API
    """
    if not GEOAPIFY_API_KEY:
        print("GEOAPIFY_API_KEY not set, using fallback system")
        return get_fallback_colleges(latitude, longitude, radius_km)
    
    try:
        # Geoapify Places API endpoint
        url = "https://api.geoapify.com/v2/places"
        
        # Parameters for educational institutions - try different approaches
        params = {
            'categories': 'education,university,college',
            'filter': f'circle:{longitude},{latitude},{radius_km * 1000}',  # radius in meters
            'limit': limit,
            'apiKey': GEOAPIFY_API_KEY,
            'lang': 'en',
            'type': 'amenity'
        }
        
        print(f"Searching for colleges within {radius_km}km of {latitude}, {longitude}")
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        colleges = []
        
        print(f"Geoapify API response: {data}")
        
        if 'features' in data and data['features']:
            for feature in data['features']:
                properties = feature.get('properties', {})
                # Only include actual educational institutions
                if any(cat in ['education', 'university', 'college', 'school'] for cat in properties.get('categories', [])):
                    colleges.append({
                        'name': properties.get('name', 'Unknown'),
                        'address': properties.get('formatted', properties.get('address_line2', '')),
                        'website': properties.get('website', ''),
                        'phone': properties.get('phone', ''),
                        'distance': properties.get('distance', 0) / 1000,  # Convert to km
                        'categories': properties.get('categories', [])
                    })
        else:
            print("No features found in Geoapify response, trying alternative search...")
            # Try alternative search with different parameters
            alt_params = {
                'text': 'university college school education',
                'filter': f'circle:{longitude},{latitude},{radius_km * 1000}',
                'limit': limit,
                'apiKey': GEOAPIFY_API_KEY,
                'lang': 'en'
            }
            
            try:
                alt_response = requests.get(url, params=alt_params, timeout=10)
                alt_response.raise_for_status()
                alt_data = alt_response.json()
                print(f"Alternative search response: {alt_data}")
                
                if 'features' in alt_data and alt_data['features']:
                    for feature in alt_data['features']:
                        properties = feature.get('properties', {})
                        # Look for educational keywords in name or categories
                        name = properties.get('name', '').lower()
                        categories = [cat.lower() for cat in properties.get('categories', [])]
                        
                        if any(keyword in name for keyword in ['university', 'college', 'school', 'institute', 'academy']) or \
                           any(cat in ['education', 'university', 'college', 'school'] for cat in categories):
                            colleges.append({
                                'name': properties.get('name', 'Unknown'),
                                'address': properties.get('formatted', properties.get('address_line2', '')),
                                'website': properties.get('website', ''),
                                'phone': properties.get('phone', ''),
                                'distance': properties.get('distance', 0) / 1000,
                                'categories': properties.get('categories', [])
                            })
            except Exception as alt_e:
                print(f"Alternative search also failed: {alt_e}")
        
        print(f"Found {len(colleges)} nearby colleges")
        
        # If no colleges found, provide some popular Indian colleges as fallback
        if len(colleges) == 0:
            print("No colleges found via Geoapify, providing fallback data...")
            colleges = get_fallback_colleges(latitude, longitude, radius_km)
            print(f"Fallback returned {len(colleges)} colleges")
        
        return colleges
        
    except requests.exceptions.RequestException as e:
        print(f"Error fetching colleges from Geoapify: {e}")
        # Return fallback colleges on API error
        return get_fallback_colleges(latitude, longitude, radius_km)
    except Exception as e:
        print(f"Unexpected error in find_nearby_colleges: {e}")
        return get_fallback_colleges(latitude, longitude, radius_km)


def get_fallback_colleges(latitude, longitude, radius_km=30):
    """Fallback colleges data for when Geoapify API fails"""
    # Popular Indian colleges with their coordinates - covering major cities
    fallback_colleges = [
        # Mumbai colleges
        {
            'name': 'Indian Institute of Technology Bombay',
            'address': 'Powai, Mumbai, Maharashtra 400076',
            'website': 'https://www.iitb.ac.in',
            'phone': '+91-22-2572-2545',
            'lat': 19.1334,
            'lon': 72.9133,
            'categories': ['university', 'education', 'engineering']
        },
        {
            'name': 'University of Mumbai',
            'address': 'Kalina, Santacruz East, Mumbai, Maharashtra 400098',
            'website': 'https://mu.ac.in',
            'phone': '+91-22-2652-3000',
            'lat': 19.0760,
            'lon': 72.8777,
            'categories': ['university', 'education']
        },
        {
            'name': 'St. Xavier\'s College',
            'address': 'Mahapalika Marg, Dhobi Talao, Mumbai, Maharashtra 400001',
            'website': 'https://xaviers.edu',
            'phone': '+91-22-2262-1300',
            'lat': 18.9368,
            'lon': 72.8276,
            'categories': ['college', 'education', 'arts']
        },
        # Delhi colleges
        {
            'name': 'Delhi University',
            'address': 'North Campus, Delhi 110007',
            'website': 'https://du.ac.in',
            'phone': '+91-11-2766-7777',
            'lat': 28.6892,
            'lon': 77.2090,
            'categories': ['university', 'education']
        },
        {
            'name': 'Indian Institute of Technology Delhi',
            'address': 'Hauz Khas, New Delhi 110016',
            'website': 'https://home.iitd.ac.in',
            'phone': '+91-11-2659-7135',
            'lat': 28.5455,
            'lon': 77.1923,
            'categories': ['university', 'education', 'engineering']
        },
        {
            'name': 'AIIMS Delhi',
            'address': 'Ansari Nagar, New Delhi 110029',
            'website': 'https://www.aiims.edu',
            'phone': '+91-11-2658-8500',
            'lat': 28.5665,
            'lon': 77.2100,
            'categories': ['university', 'education', 'medicine']
        },
        {
            'name': 'Jawaharlal Nehru University',
            'address': 'New Mehrauli Road, New Delhi 110067',
            'website': 'https://www.jnu.ac.in',
            'phone': '+91-11-2670-4100',
            'lat': 28.5402,
            'lon': 77.1660,
            'categories': ['university', 'education']
        },
        # Hyderabad colleges
        {
            'name': 'Indian Institute of Technology Hyderabad',
            'address': 'Kandi, Sangareddy, Telangana 502285',
            'website': 'https://iith.ac.in',
            'phone': '+91-40-2301-6032',
            'lat': 17.5926,
            'lon': 78.1271,
            'categories': ['university', 'education', 'engineering']
        },
        {
            'name': 'University of Hyderabad',
            'address': 'Gachibowli, Hyderabad, Telangana 500046',
            'website': 'https://uohyd.ac.in',
            'phone': '+91-40-2313-2000',
            'lat': 17.4590,
            'lon': 78.3480,
            'categories': ['university', 'education']
        },
        {
            'name': 'Osmania University',
            'address': 'Osmania University, Hyderabad, Telangana 500007',
            'website': 'https://osmania.ac.in',
            'phone': '+91-40-2768-2222',
            'lat': 17.4065,
            'lon': 78.4772,
            'categories': ['university', 'education']
        },
        {
            'name': 'NALSAR University of Law',
            'address': 'Justice City, Shamirpet, Hyderabad, Telangana 500101',
            'website': 'https://www.nalsar.ac.in',
            'phone': '+91-40-2349-8100',
            'lat': 17.5123,
            'lon': 78.4567,
            'categories': ['university', 'education', 'law']
        },
        # Bangalore colleges
        {
            'name': 'Indian Institute of Science Bangalore',
            'address': 'C.V. Raman Ave, Bengaluru, Karnataka 560012',
            'website': 'https://www.iisc.ac.in',
            'phone': '+91-80-2293-2000',
            'lat': 12.9914,
            'lon': 77.5921,
            'categories': ['university', 'education', 'science']
        },
        {
            'name': 'Indian Institute of Management Bangalore',
            'address': 'Bannerghatta Road, Bengaluru, Karnataka 560076',
            'website': 'https://www.iimb.ac.in',
            'phone': '+91-80-2699-3000',
            'lat': 12.8914,
            'lon': 77.6010,
            'categories': ['university', 'education', 'management']
        },
        {
            'name': 'Bangalore University',
            'address': 'Jnana Bharathi, Bengaluru, Karnataka 560056',
            'website': 'https://bangaloreuniversity.ac.in',
            'phone': '+91-80-2321-0101',
            'lat': 12.8567,
            'lon': 77.5049,
            'categories': ['university', 'education']
        },
        # Chennai colleges
        {
            'name': 'Indian Institute of Technology Madras',
            'address': 'IIT P.O., Chennai, Tamil Nadu 600036',
            'website': 'https://www.iitm.ac.in',
            'phone': '+91-44-2257-8000',
            'lat': 12.9914,
            'lon': 80.2337,
            'categories': ['university', 'education', 'engineering']
        },
        {
            'name': 'Anna University',
            'address': 'Sardar Patel Rd, Guindy, Chennai, Tamil Nadu 600025',
            'website': 'https://www.annauniv.edu',
            'phone': '+91-44-2235-1777',
            'lat': 12.9850,
            'lon': 80.2177,
            'categories': ['university', 'education', 'engineering']
        },
        # Pune colleges
        {
            'name': 'Indian Institute of Science Education and Research Pune',
            'address': 'Dr. Homi Bhabha Road, Pune, Maharashtra 411008',
            'website': 'https://www.iiserpune.ac.in',
            'phone': '+91-20-2590-8000',
            'lat': 18.5474,
            'lon': 73.8164,
            'categories': ['university', 'education', 'science']
        },
        {
            'name': 'University of Pune',
            'address': 'Ganeshkhind, Pune, Maharashtra 411007',
            'website': 'https://www.unipune.ac.in',
            'phone': '+91-20-2569-0000',
            'lat': 18.5522,
            'lon': 73.8267,
            'categories': ['university', 'education']
        },
        # Kolkata colleges
        {
            'name': 'Indian Institute of Technology Kharagpur',
            'address': 'Kharagpur, West Bengal 721302',
            'website': 'https://www.iitkgp.ac.in',
            'phone': '+91-3222-255-221',
            'lat': 22.3149,
            'lon': 87.3105,
            'categories': ['university', 'education', 'engineering']
        },
        {
            'name': 'University of Calcutta',
            'address': 'Senate House, 87/1, College Street, Kolkata, West Bengal 700073',
            'website': 'https://www.caluniv.ac.in',
            'phone': '+91-33-2241-0071',
            'lat': 22.5726,
            'lon': 88.3639,
            'categories': ['university', 'education']
        },
        # Vellore colleges
        {
            'name': 'Vellore Institute of Technology',
            'address': 'Vellore, Tamil Nadu 632014',
            'website': 'https://vit.ac.in',
            'phone': '+91-416-220-2000',
            'lat': 12.9692,
            'lon': 79.1559,
            'categories': ['university', 'education', 'engineering']
        }
    ]
    
    # Calculate distance and filter by radius
    def haversine_distance(lat1, lon1, lat2, lon2):
        from math import radians, cos, sin, asin, sqrt
        lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * asin(sqrt(a))
        r = 6371  # Radius of earth in kilometers
        return c * r
    
    nearby_colleges = []
    print(f"Checking {len(fallback_colleges)} fallback colleges within {radius_km}km of {latitude}, {longitude}")
    
    for college in fallback_colleges:
        distance = haversine_distance(latitude, longitude, college['lat'], college['lon'])
        print(f"College: {college['name']}, Distance: {distance:.1f}km")
        if distance <= radius_km:
            college_copy = college.copy()
            college_copy['distance'] = distance
            del college_copy['lat']
            del college_copy['lon']
            nearby_colleges.append(college_copy)
            print(f"Added {college['name']} to nearby colleges")
        else:
            print(f"Skipped {college['name']} - too far ({distance:.1f}km > {radius_km}km)")
    
    print(f"Fallback system found {len(nearby_colleges)} colleges within {radius_km}km")
    return nearby_colleges


@app.route("/recommend", methods=["POST"])
def recommend():
    try:
        data = request.get_json()
        answers = data.get('answers', {})
        user_location = data.get('location', {})  # {latitude, longitude}
        
        if not answers:
            return jsonify({"error": "No answers provided"}), 400

        # Create a more structured prompt asking for JSON output
        prompt = f"""
        You are a career counselor for Indian students. Based on the following quiz answers, recommend career paths and related courses.Using RIASEC model suggest careers.
        Quiz Answers: {json.dumps(answers)}

        🔹 Rules:
        - ALWAYS provide at least 5 career paths for future and 5 related courses and lso suggest 3 nearby colleges to the user location which have the respective courses res[].
        - The output MUST be a single JSON object.
         -Use RIASEC model to suggest careers.

        🔹 JSON Output  example Format:
        {{
          "recommendations": [
            {{
              "title": "Software Engineering",
              "score": "82% Match",
              "description": "Build innovative software solutions.",
              "details": {{
                "avg_salary": "₹6–20 LPA",
                "growth": "Very High",
                "key_skills": ["Programming", "Problem Solving", "System Design", "AI"]
              }}
            }},
            {{
              "title": "Medicine",
              "score": "78% Match",
              "description": "Diagnose and treat patients.",
              "details": {{
                "avg_salary": "₹7–18 LPA",
                "growth": "High",
                "key_skills": ["Biology", "Empathy", "Critical Thinking", "Communication"]
              }}
            }},
            {{
              "title": "Design",
              "score": "74% Match",
              "description": "Create user-centered designs.",
              "details": {{
                "avg_salary": "₹5–12 LPA",
                "growth": "High",
                "key_skills": ["Creativity", "UI/UX", "Visual Communication", "Research"]
              }}
            }}
          ],
          "courses": [
            {{
              "title": "B.Tech Computer Science (4 Years)",
              "description": "Covers programming, AI, and software systems.",
              "eligibility": "12th PCM",
              "entrance": "JEE Main/Advanced",
              "career_scope": "Excellent"
            }},
            {{
              "title": "MBBS (5.5 Years)",
              "description": "Foundation for becoming a doctor.",
              "eligibility": "12th PCB",
              "entrance": "NEET",
              "career_scope": "Excellent"
            }},
            {{
              "title": "B.Des (4 Years)",
              "description": "Focuses on design thinking and creative skills.",
              "eligibility": "12th Any Stream",
              "entrance": "NID/CEED",
              "career_scope": "Very Good"
            }}
          ]
        }}
        """

        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        
        # Parse the JSON response from the model
        try:
            # The model's response text might need some cleaning
            json_text = response.text.replace('```json', '').replace('```', '').strip()
            data = json.loads(json_text)
            
            # Find nearby colleges if location is provided
            nearby_colleges = []
            print(f"User location data: {user_location}")
            if user_location and 'latitude' in user_location and 'longitude' in user_location:
                print(f"Calling find_nearby_colleges with: {user_location['latitude']}, {user_location['longitude']}")
                nearby_colleges = find_nearby_colleges(
                    user_location['latitude'], 
                    user_location['longitude']
                )
                print(f"Main endpoint found {len(nearby_colleges)} nearby colleges")
            else:
                print("No valid location provided, skipping nearby colleges search")
            
            # Extract the recommendations and courses and return them
            return jsonify({
                "recommendations": data.get("recommendations", []),
                "courses": data.get("courses", []),
                "nearby_colleges": nearby_colleges
            })
        
        except json.JSONDecodeError as e:
            return jsonify({"error": "Failed to parse JSON from AI response: " + str(e)}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/test-location", methods=["POST"])
def test_location():
    """Test endpoint to check location-based college search"""
    try:
        data = request.get_json()
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        
        if not latitude or not longitude:
            return jsonify({"error": "Latitude and longitude required"}), 400
        
        print(f"Testing location: {latitude}, {longitude}")
        colleges = find_nearby_colleges(latitude, longitude, radius_km=30, limit=10)
        print(f"Test endpoint returning {len(colleges)} colleges")
        
        return jsonify({
            "location": {"latitude": latitude, "longitude": longitude},
            "colleges": colleges,
            "count": len(colleges)
        })
    except Exception as e:
        print(f"Error in test_location: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/test-fallback", methods=["POST"])
def test_fallback():
    """Test endpoint to check fallback college system"""
    try:
        data = request.get_json()
        latitude = data.get('latitude', 19.0760)  # Default to Mumbai
        longitude = data.get('longitude', 72.8777)
        radius_km = data.get('radius_km', 30)
        
        print(f"Testing fallback system: {latitude}, {longitude}, radius: {radius_km}km")
        colleges = get_fallback_colleges(latitude, longitude, radius_km)
        print(f"Fallback test returned {len(colleges)} colleges")
        
        return jsonify({
            "location": {"latitude": latitude, "longitude": longitude},
            "colleges": colleges,
            "count": len(colleges),
            "radius_km": radius_km
        })
    except Exception as e:
        print(f"Error in test_fallback: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/test-distance", methods=["POST"])
def test_distance():
    """Test endpoint to check distance calculation"""
    try:
        data = request.get_json()
        user_lat = data.get('latitude', 17.4260224)  # Default to Hyderabad
        user_lon = data.get('longitude', 78.6464768)
        
        # Test distance to a few known colleges
        test_colleges = [
            {"name": "IIT Delhi", "lat": 28.5455, "lon": 77.1923},
            {"name": "IIT Hyderabad", "lat": 17.5926, "lon": 78.1271},
            {"name": "University of Hyderabad", "lat": 17.4590, "lon": 78.3480},
            {"name": "Osmania University", "lat": 17.4065, "lon": 78.4772}
        ]
        
        def haversine_distance(lat1, lon1, lat2, lon2):
            from math import radians, cos, sin, asin, sqrt
            lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
            dlat = lat2 - lat1
            dlon = lon2 - lon1
            a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
            c = 2 * asin(sqrt(a))
            r = 6371  # Radius of earth in kilometers
            return c * r
        
        results = []
        for college in test_colleges:
            distance = haversine_distance(user_lat, user_lon, college['lat'], college['lon'])
            results.append({
                "name": college['name'],
                "distance_km": round(distance, 1),
                "within_30km": distance <= 30
            })
        
        return jsonify({
            "user_location": {"latitude": user_lat, "longitude": user_lon},
            "test_results": results
        })
    except Exception as e:
        print(f"Error in test_distance: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)