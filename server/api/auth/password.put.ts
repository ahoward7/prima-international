export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<{ username?: string; currentPassword?: string; newPassword?: string }>(event)

    if (!body?.username || !body?.currentPassword || !body?.newPassword) {
      return problem(event, 400, 'Validation error', 'Username, current password, and new password are required')
    }

    const user = await UserSchema.findOne({ username: body.username })
    if (!user) {
      return problem(event, 401, 'Invalid credentials', 'Invalid username or password')
    }

    const valid = await verifyPassword(body.currentPassword, user.password)
    if (!valid) {
      return problem(event, 401, 'Invalid credentials', 'Invalid username or password')
    }

    if (body.newPassword.length < 6) {
      return problem(event, 400, 'Weak password', 'New password must be at least 6 characters long')
    }

    if (body.newPassword === 'password') {
      return problem(event, 400, 'Invalid password', 'New password cannot be the default password')
    }

    user.password = await hashPassword(body.newPassword)
    await user.save()

    return ok(event, { ok: true })
  }
  catch (error: any) {
    return problem(event, error?.statusCode || 500, 'Password update failed', error?.message || 'Unexpected error')
  }
})
