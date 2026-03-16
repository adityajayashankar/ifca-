echo "Kill the running PM2 actions"
npx pm2 delete nextjsv1.2

echo "Jump to app folder"
cd /home/ubuntu/senior-central

echo "Update app from Git"
git pull

echo "Install app dependencies"
sudo rm -rf node_modules
sudo yarn install

echo "Build your app"
sudo yarn build

echo "Run new PM2 action"
npx pm2 start ecosystem.json
