// Importacion de Modulos

const express = require('express');
const app = express();
const exphbs = require('express-handlebars')
const expressFileUpload = require('express-fileupload')
const jwt = require('jsonwebtoken')
const secretKey = "secreto"
const axios = require('axios')
const fs = require('fs')

//  Importacion de consultas SQL
const {
    getUsers,
    registerNewUser,
    getUser,
    updateUser,
    deleteUser,
    getPhotoName,
    changeUserState
} = require('./consultas');

//  Creación de servidor
app.listen(3000, () => console.log("Servidor funcionando en http://localhost:3000"))

// Disponibilización de carpetas publicas para express
app.use("/public", express.static(__dirname + "/public"))
app.use("/nModules", express.static(__dirname + "/node_modules"))

// 
app.use(express.json())
app.use(express.urlencoded({
    extended: true
}));

// Parametros de FileUpload para el manejo de imagenes
app.use(expressFileUpload({
    limits: 5000000,
    abortOnLimit: true,
    responseOnLimit: "El tamaño de la imagen supera el limite permitido"
}))

// Configuración de Handlebars
app.engine(
    "handlebars",
    exphbs({
        defaultLayout: "main",
        layoutsDir: `${__dirname}/views/main`,
        helpers: {
            plus1: function (index) {
                return parseInt(index) + 1
            },
            approved: function (bool) {
                if (bool == true) {
                    return `class="text-success font-weight-bold">Aprobado`
                } else {
                    return `class="text-warning font-weight-bold">En Revisión`
                }
            },
            approvedCheckbox: function (bool) {
                if (bool == true) {
                    return "checked"
                } else {
                    return ``
                }
            }
        }
    })
)

app.set("view engine", "handlebars")

// Endpoins

app.get("/", async (req, res) => {
    const skaters = await getUsers()
    res.render("index", {
        skaters
    })
})

app.get("/Login", (req, res) => {
    res.render("Login")
})

app.get("/Registro", async (req, res) => {
    const data = await getUsers()
    const registeredEmails = data.map((u) => u.email)
    res.render("Registro", {
        registeredEmails
    })
})


// CRUD
app.get("/Admin", async (req, res) => {
    const skaters = await getUsers()
    res.render("Admin", {
        skaters
    })
})

app.put("/Admin", async (req, res) => {
    const {
        id,
        state
    } = req.body
    const data = await changeUserState([id, state])
    res.send({
        message: "El estado del usuario ha sido modificado",
        details: data
    })
})
app.delete("/Datos", async (req, res) => {
    const {
        id
    } = req.body
    const data = await deleteUser(id)
    res.send("Usuario eliminado con éxito.")
})


// Verificación y ruta para JWT
app.post("/verify", async (req, res) => {
    const user = req.body
    const registeredUsers = await getUsers()
    const loggedUser = registeredUsers.find((u) => u.email == user.email && u.password == user.password)
    const token = jwt.sign({
            exp: Math.floor(Date.now() / 1000) + 100,
            data: loggedUser
        },
        secretKey
    )

    loggedUser ? res.send(token) : res.status(401).send({
        error: "Usuario no registrado",
        code: 401
    })
})

app.get("/Datos/:token", (req, res) => {
    const {
        token
    } = req.params
    jwt.verify(token, secretKey, (err, decoded) => {
        const {
            data
        } = decoded
        err ? res.status(401).send(
                res.send({
                    error: "401 Unauthorized",
                    message: "Usted no esta autorizado para ingresar",
                    token_error: err.message
                })
            ) :
            res.render("Datos", {
                data
            })
    })
})

// Guardado de imagen

app.post("/Registro", (req, res) => {
    if (Object.keys(req.files).length == 0) {
        return res.status(400).send("No se encontró ningún archivo en la consulta")
    }
    let body = req.body
    const {
        email,
        nombre
    } = body
    const {
        photo
    } = req.files
    const {
        name: photo_name
    } = photo
    delete body.confirmedPassword
    body.photo = `/public/fotos/${photo_name}`
    try {
        photo.mv(`${__dirname}/public/fotos/${photo_name}`, async (err) => {
            if (err) return res.status(500).res.send({
                error: `Algo salió mal... ${err}`,
                code: 500
            })
            await registerNewUser(Object.values(body));

            res.send({
                message: `¡Bienvenido ${nombre}! Gracias por registrarte`,
                url: "/"
            })
        })

    } catch (error) {
        console.log(error)
    }
})

app.put("/Datos", async (req, res) => {
    let body = req.body
    delete body.confirmedPassword
    const {
        email,
        nombre,
        id
    } = body
    body.anos_experiencia = parseInt(body.anos_experiencia)

    if (!req.files) {
        const {
            foto: photo
        } = await getUser([id])
        body.photo = photo
        const data = await updateUser(Object.values(body))
        res.send(`Usuario ${nombre} actualizado con éxito`)
    } else {
        const {
            photo
        } = req.files
        const {
            name: new_photo_name
        } = photo
        const old_photo_name = await getPhotoName([id])
        body.photo = `/public/fotos/${new_photo_name}`
        const data = await updateUser(Object.values(body))
        photo.mv(`${__dirname+body.photo}`, async (err) => {
            if (err) return res.status(500).res.send({
                error: `Algo salió mal... ${err}`,
                code: 500
            })
            fs.unlinkSync(__dirname + old_photo_name)
            res.send(`Usuario ${nombre} actualizado con éxito`)

        })
    }
})




