import { pool, connectToDb } from './connection.js';
import inquirer from "inquirer";
await connectToDb();
async function init() {
    const response = await inquirer.prompt([
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
                'Update an employee role',
                'View employees by department',
                'Delete a department',
                'Delete a role',
                'View department budget',
                'Exit'
            ]
        }
    ]);
    console.log(response);
    if (response.userChoice === 'View all departments') {
        await viewAllDepartments();
    }
    else if (response.userChoice === 'View all roles') {
        await viewAllRoles();
    }
    else if (response.userChoice === 'View all employees') {
        await viewAllEmployees();
    }
    else if (response.userChoice === 'Add a department') {
        const { newDepartment } = await inquirer.prompt({
            type: 'input',
            name: 'newDepartment',
            message: 'Enter department name'
        });
        await pool.query('INSERT INTO department (name) VALUES ($1)', [newDepartment]);
        console.log(`Department ${newDepartment} added.`);
        await init();
    }
    else if (response.userChoice === 'Add a role') {
        const { newRole, newSalary, newRoleDepartment } = await inquirer.prompt([
            {
                type: 'input',
                name: 'newRole',
                message: 'Enter the name of the role',
            },
            {
                type: 'input',
                name: 'newSalary',
                message: 'Enter salary for the role',
            },
            {
                type: 'list',
                name: 'newRoleDepartment',
                message: 'Choose a department for the role',
                choices: await getDepartmentNames()
            }
        ]);
        await pool.query('INSERT INTO role (title, salary, department_id) VALUES ($1, $2, (SELECT id FROM department WHERE name = $3))', [newRole, newSalary, newRoleDepartment]);
        console.log(`Role ${newRole} added.`);
        await init();
    }
    else if (response.userChoice === 'Add an employee') {
        const { newLastName, newFirstName, newRoleId, newEmployeeManager } = await inquirer.prompt([
            {
                type: 'input',
                name: 'newLastName',
                message: 'Enter the last name of the new employee',
            },
            {
                type: 'input',
                name: 'newFirstName',
                message: 'Enter the first name of the new employee',
            },
            {
                type: 'list',
                name: 'newRoleId',
                message: 'Choose the role for the new employee',
                choices: await getRoleNames()
            },
            {
                type: 'list',
                name: 'newEmployeeManager',
                message: 'Choose the manager for the new employee',
                choices: await getNewEmployeeManagers()
            }
        ]);
        await pool.query(`INSERT INTO employee (last_name, first_name, role_id, manager_id)
             VALUES ($1, $2, $3, $4)`, [newLastName, newFirstName, newRoleId, newEmployeeManager]);
        console.log(`Employee ${newFirstName} ${newLastName} added.`);
        await init();
    }
    else if (response.userChoice === 'Update an employee role') {
        const { empForNewRole, newEmpRole } = await inquirer.prompt([
            {
                type: 'list',
                name: 'empForNewRole',
                message: 'Choose the employee',
                choices: await getEmployeeNames()
            },
            {
                type: 'list',
                name: 'newEmpRole',
                message: 'Choose the new role for the employee',
                choices: await getNewRole()
            }
        ]);
        await pool.query('UPDATE employee SET role_id = $1 WHERE id = $2', [newEmpRole, empForNewRole]);
        console.log(`${newEmpRole} assigned`);
        await init();
    }
    else if (response.userChoice === 'View employees by department') {
        const { departChoice } = await inquirer.prompt([
            {
                type: 'list',
                name: 'departChoice',
                message: "Choose the department",
                choices: await getDepart()
            },
        ]);
        const { rows } = await pool.query('SELECT employee.first_name, employee.last_name, department.name FROM employee LEFT JOIN role ON employee.role_id = role.id LEFT JOIN department ON department.id = role.department_id WHERE department.id = $1', [departChoice]);
        console.table(rows);
        await init();
    }
    else if (response.userChoice === 'Delete a department') {
        const { departChoice } = await inquirer.prompt([
            {
                type: 'list',
                name: 'departChoice',
                message: 'Choose the department to delete',
                choices: await getDepart()
            }
        ]);
        await pool.query('DELETE FROM department WHERE name = $1', [departChoice]);
        console.log(`${departChoice} deleted`);
        await init();
    }
    else if (response.userChoice === 'Delete a role') {
        const { roleToDelete } = await inquirer.prompt([
            {
                type: 'list',
                name: 'roleToDelete',
                message: 'Choose the role to delete',
                choices: await chooseRole()
            }
        ]);
        await pool.query('DELETE FROM role WHERE title = $1', [roleToDelete]);
        console.log(`${roleToDelete} deleted`);
        await init();
    }
    else if (response.userChoice === 'View department budget') {
        const { departChoice } = await inquirer.prompt([
            {
                type: 'list',
                name: 'departChoice',
                message: 'Choose a department',
                choices: await getDepart()
            }
        ]);
        const { rows } = await pool.query('SELECT SUM(role.salary) FROM employee LEFT JOIN role ON employee.role_id = role.id LEFT JOIN department ON role.department_id = department.id WHERE department.id = $1', [departChoice]);
        console.log(`The budget for ${departChoice} is $${rows[0].sum || 0}`);
        await init();
    }
    else if (response.userChoice === 'Exit') {
        process.exit(0);
    }
}
async function viewAllDepartments() {
    const { rows } = await pool.query('SELECT * FROM department');
    console.table(rows);
    await init();
}
async function viewAllRoles() {
    const { rows } = await pool.query('SELECT * FROM role');
    console.table(rows);
    await init();
}
async function viewAllEmployees() {
    const { rows } = await pool.query('SELECT * FROM employee');
    console.table(rows);
    await init();
}
async function getDepartmentNames() {
    const { rows } = await pool.query('SELECT name FROM department');
    return rows.map(row => row.name);
}
async function getRoleNames() {
    const { rows } = await pool.query('SELECT id as VALUE, title AS name FROM role');
    return rows;
}
async function getNewEmployeeManagers() {
    const { rows } = await pool.query('SELECT id AS value, CONCAT(first_name, last_name) AS name FROM employee');
    const managerChoice = rows;
    managerChoice.push({ value: null, name: null });
    return managerChoice;
}
async function getEmployeeNames() {
    const { rows } = await pool.query('SELECT id AS value, CONCAT(first_name, last_name) AS name FROM employee');
    return rows;
}
async function getDepart() {
    const { rows } = await pool.query('SELECT id AS value, name FROM department');
    return rows;
}
async function getNewRole() {
    const { rows } = await pool.query('SELECT id AS value, title AS name FROM role');
    return rows;
}
async function chooseRole() {
    const { rows } = await pool.query('SELECT id AS value, title AS name FROM role');
    return rows;
}
await init();
