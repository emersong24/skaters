// Conección a BBDD por el método pool

const {
    Pool
} = require('pg')

const pool = new Pool({
    user: "postgres",
    host: "localhost",
    password: "242424",
    database: "skatepark",
    port: 5432
})

//  Consultas SQL
const getUsers = async () => {
    const sqlQuery = {
        text: "SELECT * FROM skaters",

    }

    const res = await pool.query(sqlQuery)
    return res.rows
}

const getUser = async (id) => {
    const sqlQuery = {
        text: `SELECT * FROM skaters WHERE id = ${id}`
    }
    const res = await pool.query(sqlQuery)
    return res.rows[0]
}
const registerNewUser = async (values) => {
    const sqlQuery = {
        text: "INSERT INTO skaters(id,email,nombre,password,anos_experiencia,especialidad,foto,estado) values(DEFAULT, $1, $2, $3, $4, $5, $6,'f') RETURNING *;",
        values
    }
    const res = await pool.query(sqlQuery)
    return res.rows
}

const updateUser = async (values) => {
    const sqlQuery = {
        text: "UPDATE skaters set email = $1, nombre = $2, password = $3, anos_experiencia = $4, especialidad = $5, foto =$7 WHERE id = $6 RETURNING *;",
        values
    }
    const res = await pool.query(sqlQuery)
    return res.rows

}

const deleteUser = async (id) => {
    const sqlQuery = {
        text: `DELETE from skaters where id = ${id} RETURNING *;`
    }
    const res = await pool.query(sqlQuery)
    return res.rowCount
}

const getPhotoName = async (values) => {
    const sqlQuery = {
        text: "SELECT foto from skaters where id = $1",
        values
    }
    const res = await pool.query(sqlQuery)
    return res.rows[0].foto
}

const changeUserState = async (values) => {
    const sqlQuery = {
        text: "UPDATE skaters set estado = $2 WHERE id = $1 RETURNING *;",
        values
    }
    const res = await pool.query(sqlQuery)
    return res.rows
}

// Exportación de consultas
module.exports = {
    getUsers,
    registerNewUser,
    getUser,
    updateUser,
    deleteUser,
    getPhotoName,
    changeUserState
}
