
<!-- 🔐 Authentication APIs -->
Method	Endpoint	Access	Description

POST	/api/auth/register	Public	        Register new user (citizen)
POST	/api/auth/login	    Public	        Login user and return JWT
GET	    /api/auth/profile	Authenticated	Get current user profile
PUT	    /api/auth/profile	Authenticated	Update user profile


<!-- 👤 User / Citizen APIs -->
Method	Endpoint	Access	Description

GET	    /api/issues/my	    Citizen	        Get issues created by logged-in user
GET	    /api/issues/:id	    Authenticated	View issue details
POST    /api/issues	        Citizen	        Create new issue report
POST	/api/issues/:id/comment	Authenticated	Comment on an issue
POST	/api/issues/:id/vote	Authenticated	Vote / upvote an  issue


<!-- 📍 Issue Management APIs (Admin) -->
Method	Endpoint	Access	Description

GET	    /api/issues	                Admin	Get all reported issues
PUT	    /api/issues/:id/status	    Admin	Update issue status
PUT	    /api/issues/:id/priority	Admin	Update issue priority
POST	/api/issues/:id/merge	    Admin	Merge duplicate issues


<!-- 🗺️ Map & Filtering APIs -->
Method	Endpoint	Access	Description

GET	    /api/issues/map	    Authenticated	Get issues with location for map
GET	    /api/issues/search	Authenticated	Filter issues (category, area, status)


<!-- 📊 Analytics APIs (Admin) -->
Method	Endpoint	Access	Description

GET	    /api/analytics/summary	Admin	Get total issues, categories count
GET	    /api/analytics/hotspots Admin
Get hotspot areas


<!-- ⭐ Advanced Feature APIs -->

<!-- 🔁 Duplicate Detection -->
Method	Endpoint	Access	Description
POST	/api/issues/check-duplicate	System	Check if issue is duplicate

<!-- 🤖 AI Category Suggestion -->
Method	Endpoint	Access	Description
POST	/api/issues/suggest-category	System	Suggest issue category from text

<!-- 🏅 Gamification -->
Method	Endpoint	Access	Description

GET	    /api/gamification/points	Authenticated	Get user points
GET	    /api/gamification/badges	Authenticated	Get earned badges

<!-- 📡 Notifications -->
Method	Endpoint	Access	Description

GET	    /api/notifications	Authenticated	Get user notifications
PUT	    /api/notifications/:id/read	Authenticated	Mark notification as read

<!-- 📱 PWA / Offline Sync -->
Method	Endpoint	Access	Description
POST	/api/issues/sync-offline	Citizen	Sync offline-saved reports



<!-- 🔒 API RULES (VERY IMPORTANT)

All protected routes require JWT

Admin routes require role = admin

Image upload handled via multipart/form-data

No endpoint changes after this without team agreement -->