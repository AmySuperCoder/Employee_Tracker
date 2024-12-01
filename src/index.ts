import { pool, connectToDb } from './connection.js';
import inquirer from "inquirer"
await connectToDb();

async function init() {
//let {rows} = await pool.query('SELECT * FROM employee')
//console.log(rows)
inquirer.prompt([
    {
        type: 'list', 
        name: 'userChoice',
        message: 'What would you like to do?',
        choices: [
            'View all departments', 
            'View all roles', 
            'View all employees', 
            'Add a department', 
            'Add a role', 
            'Add an employee', 
            'Update an employee role'
        ]
    }
])
.then((response)=> {
    console.log(response)
    if (response.userChoice == 'View all departments') {
        viewAllDepartments()
    }

    else if (response.userChoice == 'View all roles') {
        viewAllRoles()
    }


    else if (response.userChoice == 'View all employees') {
     viewAllEmployees()   
    }

    else if (response.userChoice == 'Add a department') {
        inquirer .prompt({
            type: 'input',
            name: 'newDepartment',
            message: 'Enter department name'
        })
    }
})
}
init()

async function viewAllDepartments(){
    let {rows} = await pool.query('SELECT * FROM department')
    console.table(rows)
}

async function viewAllRoles(){
    let {rows} = await pool.query('SELECT * FROM role')
    console.table(rows)
}

async function viewAllEmployees(){
    let {rows} = await pool.query('SELECT * FROM employee')
    console.table(rows)
}

