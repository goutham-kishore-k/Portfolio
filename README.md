# Portfolio Website

A modern, responsive portfolio website built with React, showcasing professional experience, projects, and technical skills.

## 🌟 Features

- **Home**: Animated introduction with typewriter effect
- **About**: Professional background, tech stack, and GitHub activity
- **Projects**: Showcase of work, academic, and personal projects
- **Resume**: Interactive PDF viewer with download option
- **ChatBot**: AI-powered chatbot (requires backend setup)
- **Responsive Design**: Mobile-friendly with Bootstrap
- **Particle Effects**: Interactive background animations

## 🚀 Tech Stack

- React 17
- React Router DOM
- React Bootstrap
- TypeScript Particles
- React PDF
- React GitHub Calendar
- Typewriter Effect
- Google Generative AI (Gemini)

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/goutham-kishore-k/portfolio.git
cd portfolio
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

## 🛠️ Available Scripts

- `npm start` - Runs the app in development mode
- `npm build` - Builds the app for production
- `npm test` - Launches the test runner
- `npm eject` - Ejects from Create React App (one-way operation)

## ⚙️ Configuration

### Update Personal Information

1. **Social Links**: Edit `src/components/Home/Home2.js`
2. **GitHub Username**: Update in `src/components/About/Github.js`
3. **Resume**: Replace `src/Assets/GOUTHAM_RESUME.pdf` with your PDF
4. **Projects**: Modify `src/components/Projects/Projects.js`
5. **About Section**: Edit `src/components/About/AboutCard.js`
6. **Tech Stack**: Update `src/components/About/Techstack.js`

### ChatBot Setup

The chatbot requires backend configuration. See [CHATBOT_SETUP.md](CHATBOT_SETUP.md) for detailed instructions.

## 🎨 Customization

- **Colors**: Edit CSS variables in `src/style.css` and `src/App.css`
- **Images**: Replace files in `src/Assets/`
- **Particles**: Configure in `src/components/Particle.js`

## 📁 Project Structure

```
Portfolio/
├── public/
│   ├── index.html
│   ├── manifest.json
│   └── robots.txt
├── src/
│   ├── components/
│   │   ├── About/
│   │   ├── Home/
│   │   ├── Projects/
│   │   ├── Resume/
│   │   └── chatBot.js
│   ├── Assets/
│   ├── api/
│   ├── App.js
│   ├── index.js
│   └── style.css
└── package.json
```

## 🚀 Deployment

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify
```bash
npm run build
# Drag and drop 'build' folder to Netlify
```

### Deploy to GitHub Pages
1. Install gh-pages: `npm install gh-pages --save-dev`
2. Add to `package.json`:
```json
"homepage": "https://yourusername.github.io/portfolio",
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d build"
}
```
3. Deploy: `npm run deploy`

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 👤 Author

**Goutham Kishore Krishnamoorthy**
- GitHub: [@goutham-kishore-k](https://github.com/goutham-kishore-k)
- LinkedIn: [goutham-kishore-k](https://www.linkedin.com/in/goutham-kishore-k)

---

⭐ Star this repo if you found it helpful!
