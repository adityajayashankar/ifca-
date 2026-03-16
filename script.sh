# Setup admin-frontend
echo "Installing admin dependencies"
cd ./admin-frontend
yarn install
# yarn dev
echo "Admin frontend started.."
# Setup 
echo "Installing client dependencies"
cd ../frontend
yarn install
# yarn dev
echo "Client frontend started.."
##
echo "Installing API dependencies"
cd ../backend
yarn install
echo "Provision 1. RDS-> initialize it in core-backend/.env.example"
echo "2. execute cp .env.example .env"
echo "Provision 3. S3"
echo "Initialisze it in admin and client panels and you are good to go!"

