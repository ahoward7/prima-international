import { defineMongooseModel } from '#nuxt/mongoose'

export const UserSchema = defineMongooseModel<User>({
  name: 'User',
  schema: {
    u_id: { type: String, required: true },
    username: { type: String, required: true },
    password: { type: String, required: true },
    initials: { type: String, required: true }
  }
})