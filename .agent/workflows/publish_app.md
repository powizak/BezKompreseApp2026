---
description: Build, deploy to Firebase Hosting, and push changes to GitHub. Use this workflow to publish the app.
---

0. Increment the version of app across all platforms
// turbo
Check the current version and build number in `android/app/build.gradle` (versionName and versionCode). Increment the version of app (mainVersion.Subversion.Change) by the changes made in app (mainVersion is only for Main releases, which has to be said by user), and increment the build number by 1. Run `npm run version:set <new_version> <new_build_number>` to sync it across package.json, Android and iOS. 

1. Build the production version of the app
// turbo
npm run build

2. Deploy to Firebase Hosting
// turbo
npx firebase deploy --only hosting

2.5. Build and deploy Cloud Functions (if changed)
// turbo
npm run build --prefix functions && npx firebase deploy --only functions

3. Update information about app
// turbo 
Update @readme.md and @ideas.md by the changes that was made in current run (ideas only if there were some changes to it)

4. Check the status of the repository
// turbo
git status

5. Stage all changes for commit
// turbo
git add .

6. Commit the changes (Update the message as needed)
git commit -m "chore: build and deploy"

7. Push changes to GitHub
// turbo
git push

8. Sync project for Android
// turbo
npx cap sync android

9. Open Android Studio
// turbo
npx cap open android