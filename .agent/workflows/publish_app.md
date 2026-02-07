---
description: Build, deploy to Firebase Hosting, and push changes to GitHub. Use this workflow to publish the app.
---

0. Increment the verion of app in package.json
// turbo
change the version of app (mainVersion.Subversion.Change) by the changes made in app (mainVersion is only for Main releases, which has to be said by user) 

1. Build the production version of the app
// turbo
npm run build

2. Deploy to Firebase Hosting
// turbo
npx firebase deploy --only hosting

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

7. Sync project for Android
// turbo
npx cap sync android

8. Open Android Studio
// turbo
npx cap open android