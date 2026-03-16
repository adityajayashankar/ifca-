## Email-setup done. 
exec:
  yarn add mailgun-js


# DOJO ALPHA

Don't mess with the DOJO xD

documentation for routes: https://glow-cosmonaut-ffa.notion.site/Senior-central-Wiki-4c24a1c3cff4413da63fa6e54c25948f

> backend documentation

Guide for Changes/Improvement:

- Use async/await, over classical promises.
- If you identify repetitive code in controllers, add a function in services in corresponding file
  and return a pending promise

Guide for changes in Schema:

- Make the required change
- npx prisma migrate dev --name "<migrationName>" : for making changes to the DB Schema
- npx prisma generate : Generates required client code, for intellisense(mostly doesnt work xD/ restart VsC)

Deployment:

- This project has an instance at xxx:8000 in an ec2, along side the frontend at xxx:3000
- go to ~/dojo-alpha
- git pull
- npm install for changes
- pm2 reload Dojo_Backend
- voila! Your api is updated!

There are some known errors, make sure you raise a ticket and then start working!
