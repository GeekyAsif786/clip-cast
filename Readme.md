<h1 align="center" id="title">Clip-Cast</h1>

<p align="center"><img src="https://socialify.git.ci/GeekyAsif786/clip-cast/image?custom_description=%F0%9F%93%BA+YouTube+Clone+%E2%80%93+MERN+Stack++A+full-stack+video+streaming+platform+built+with+the+MERN+stack+%28MongoDB%2C+Express%2C+React%2C+Node.js%29&amp;custom_language=Express&amp;description=1&amp;font=Raleway&amp;language=1&amp;name=1&amp;owner=1&amp;pattern=Circuit+Board&amp;theme=Dark" alt="project-image"></p>

<p id="description">📺 YouTube Clone – MERN Stack A full-stack video streaming platform built with the MERN stack (MongoDB Express React Node.js). Features include video upload playback likes comments and a modern UI inspired by YouTube.</p>

🔗 [Data Model Link](https://app.eraser.io/workspace/elvW5w7SoRVVzoQsJFKy?origin=share&elements=Y0Hn2UeN8z6aKwda9DY-rQ)  
  
<h2>🧐 Features</h2>

Here're some of the project's best features:

*   Video playback
*   Playlist Creation/Deletion
*   User Authentication(Login/Registration)
*   Like Comments share
*   Subscribe channel
*   Watch History
*   Create and Publish Video
*   Post tweets
*   Professional User Dashboard

<h2>🛠️ Installation Steps:</h2>

<p>1. Run the dependencies installer command</p>

```
npm install
```

<p>2. Create a .env file to set the env variables (In CLI type the command))</p>

```
touch .env
```

<p>3. Change the environment variables as per your own data</p>

<p>4. Run the development server after checking all routes and endpoints</p>

```
npm run dev
```

<p>5. Now. your server is up and running on the PORT specified in .env file</p>

<h2>🍰 Contribution Guidelines:</h2>

📘 Contributing to ClipCast (YouTube Clone) First off thank you for your interest in contributing to ClipCast — an open-source YouTube-like platform built with the MERN stack. Your ideas improvements and bug fixes make this project better for everyone! 

  <h2>🧩 What You Can Contribute</h2> 

We’re open to all meaningful contributions! You can help by: 
<ul>
<li>🐛 Fixing Bugs: Found something broken? Open an issue or submit a fix.</li> 
<li>🌟 Adding New Features: Build new backend endpoints authentication methods or media-related tools.</li> 
<li>🎨 Frontend/UI Versions: Create your own unique frontend (React Next.js Vue etc.) using this backend as the core API layer. Show off your creativity and make a new look for ClipCast!</li> 
<li>⚙️ Improving Performance or Code Quality: Refactor existing code optimize queries or simplify controllers.</li> 
<li>🧠 Enhancing Documentation: Improve READMEs API docs or write developer onboarding guides.</li></ul>
<br>

<h2>🚀 Getting Started</h2>
<h4>Follow these steps to set up your development environment:</h4>

<p> 1) Fork the repository on GitHub </p>
<p> 2) Clone your fork locally: </p>

```
git clone https://github.com/<your-username>/clip-cast.git
```
<p> 3) Install dependencies:

```
cd clip-cast
npm install
```
<p> 4) Set up your environment variables:
Create a .env file in the root directory and configure your secrets:</p>

```
touch .env
```
Example contents:

```
PORT=8000
MONGODB_URI=<your_mongo_uri>
CORS_ORIGIN=http://localhost:3000
ACCESS_TOKEN_SECRET=<secret_key>
REFRESH_TOKEN_SECRET=<refresh_secret>
CLOUDINARY_API_KEY=<api_key>
CLOUDINARY_API_SECRET=<api_secret>
CLOUDINARY_CLOUD_NAME=<cloud_name>

```
<p> 5) Run the backend: </p>

```
npm run dev
```

 <p>6) (Optional) Start building your own frontend!

<ul>
<li>You can build a custom UI and integrate it with this backend via the REST APIs.</li>

<li>Make sure your frontend runs on http://localhost:3000 for local testing (or update CORS_ORIGIN accordingly).</li></ul> 
</p>

<h2> 🧾 Git Workflow </h2>
Please follow this simple branching model:
<br>
<p>1) Create a branch for your feature or fix:</p>

```
bash

git checkout -b feature/add-video-search
```
<p>2) Commit your changes with clear messages, here's an example:</p>

```
bash

git commit -m "Add video search API endpoint"
```
<p>3) Push to your fork: </p>

```
bash

git push origin feature/add-video-search
```
<p>4) Open a Pull Request (PR) on the main repository:
<ul><li>Explain what the change does</li>
<li>Mention any related issues (if applicable)</li></ul>
</p>

<h2>🧠 Code Style Guidelines</h2>
<br>
<p>To maintain consistency:</p>
<ul>
  <li><strong>Use ESLint + Prettier</strong> for formatting</li>
  <li><strong>Use async/await</strong> for async operations</li>
  <li>Keep <strong>controllers lean</strong> and <strong>logic modularized</strong></li>
  <li>Always handle errors gracefully using <code>ApiError</code> and <code>asyncHandler</code></li>
  <li>Document new routes using <strong>Swagger comments</strong> if possible</li>
</ul>
<br>
<h2>❤️ Acknowledgments</h2>
<br>
<p>Thanks for helping improve ClipCast!
Every contribution — from fixing typos to building new modules — is valuable.
Let’s make open source more creative and collaborative</p>
  
<h2>💻 Built with</h2>

Technologies used in the project:

*   NodeJs
*   ExpressJs
*   MongoDB
*   JWTAuth
*   MongoDB transactions
*   GIt/GitHub
*   Postman(for testing)

<h2>🛡️ License:</h2>

This project is licensed under the MIT
