import { Router } from 'express'
import { userController } from '../controllers/user.controller.js'
import { authenticate } from '../middlewares/authenticate.js'
import { authorize } from '../middlewares/authorize.js'
import { validate } from '../middlewares/validate.js'
import {
  changePasswordSchema,
  createUserSchema,
  listUsersQuerySchema,
  updateUserSchema,
  userIdParamSchema
} from '../schemas/user.schema.js'

export const userRoutes = Router()

userRoutes.use(authenticate)

userRoutes.get(
  '/',
  authorize('ADMIN', 'OPERATOR'),
  validate(listUsersQuerySchema, 'query'),
  userController.list
)

userRoutes.post(
  '/',
  authorize('ADMIN'),
  validate(createUserSchema),
  userController.create
)

userRoutes.get(
  '/:id',
  validate(userIdParamSchema, 'params'),
  userController.show
)

userRoutes.put(
  '/:id',
  validate(userIdParamSchema, 'params'),
  validate(updateUserSchema),
  userController.update
)

userRoutes.patch(
  '/:id',
  validate(userIdParamSchema, 'params'),
  validate(updateUserSchema),
  userController.update
)

userRoutes.delete(
  '/:id',
  authorize('ADMIN'),
  validate(userIdParamSchema, 'params'),
  userController.remove
)

userRoutes.patch(
  '/:id/password',
  validate(userIdParamSchema, 'params'),
  validate(changePasswordSchema),
  userController.changePassword
)
