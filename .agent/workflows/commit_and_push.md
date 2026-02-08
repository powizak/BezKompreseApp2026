---
description: Commit and push changes to GitHub. Use this workflow to add new changes of the app.
---

1. Build the production version of the app
// turbo
npm run build

2. Update information about app
// turbo 
Update @readme.md and @ideas.md by the changes that was made in current run (ideas only if there were some changes to it)

3. Check the status of the repository
// turbo
git status

4. Stage all changes for commit
// turbo
git add .

5. Commit the changes (Update the message as needed)
git commit -m "chore: build and deploy"

6. Push changes to GitHub
// turbo
git push