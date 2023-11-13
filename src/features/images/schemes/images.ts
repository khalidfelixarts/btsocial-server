import Joi, { ObjectSchema } from 'joi';

const addImageSchema: ObjectSchema = Joi.object().keys({
  image: Joi.string().required().messages({
    'string.empty': 'Please select image'
  })
});

export { addImageSchema };
