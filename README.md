### Technical Specifications
* Frontend: EJS, CSS, Javascript
* Backend: ExpressJS
* Database: MySQL

### Features
- Authentication: Login, signup, resetPassword, updatePassword
- Authorization:
  - Restrict users, admin, guides what they can do
- Admin:
  - An admin account is provided
  - Create, read, update the booking status
  - Search booking information 
  - Checkin - checkout
- Users:
  - Update user information
  - Review room types and prices
  - Booking validation
  - Recommend the rooms number for each chosen room type 
  - Bill displaying

## Setup
1. Press the **Fork** button (top right the page) to save copy of this project on your account.
2. Download the repository files (project) from the download section or clone this project to your local machine by typing in the bash the following command:

      git clone https://github.com/khuatbaonguyen123/HotelBooking.git
3. Install some essential libraries: `npm install`
4. Import & execute the SQL queries from the Database folder to the MySQL database.
5. Import the project in any IDE that support the aforementioned programming languages.
6. Deploy & Run the application with `npm run dev` :D

## Project Structure
    ├── bookingapp_query    # tables and queries used for this project
    |   └── bookingapp.jpg
    |   └── bookingapp.sql
    ├── pages               #ejs files
    ├── public              
    ├── routes              #code files
    |   └── admin.js
    |   └── booking.js
    |   └── general.js
    |   └── users.js    
    ├── .env
    ├── .gitignore
    ├── README.md
    ├── database.js
    ├── HBWpresentSlide.pdf
    ├── index.js
    ├── package-lock.json
    └── package.json

## Collaborators
