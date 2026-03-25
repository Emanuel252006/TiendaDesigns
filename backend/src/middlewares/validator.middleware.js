export const validateSchema = (shema) =>(req, res, next)=>{

    try{
        shema.parse(req.body);
        next();
    }catch(error){
        // Convertir los errores de Zod a un objeto con las claves de los campos
        const errorObject = {};
        error.errors.forEach((err) => {
            const fieldName = err.path[0]; // Obtener el nombre del campo
            // Si ya existe un error para este campo, agregar el nuevo error
            if (errorObject[fieldName]) {
                errorObject[fieldName] = Array.isArray(errorObject[fieldName]) 
                    ? [...errorObject[fieldName], err.message]
                    : [errorObject[fieldName], err.message];
            } else {
                errorObject[fieldName] = err.message;
            }
        });
        return res.status(400).json(errorObject);
    }
};