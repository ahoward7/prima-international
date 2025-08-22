export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<{ username?: string; password?: string }>(event)

    if (!body?.username || !body?.password) {
      return problem(event, 400, 'Validation error', 'Username and password are required')
    }

    const userDoc = await UserSchema.findOne({ username: body.username })
    const user = userDoc?.toObject()

    if (!userDoc || !user) {
      return problem(event, 401, 'Invalid credentials', 'Invalid username or password')
    }
    
    const passwordToCheck = user.password === 'password' ? await hashPassword(user.password) : user.password

    const valid = await verifyPassword(passwordToCheck, body.password)
    if (!valid) {
      return problem(event, 401, 'Invalid credentials', 'Invalid username or password')
    }

    if (!isBcryptHash(user.password)) {
      userDoc.password = await hashPassword(body.password)
      await userDoc.save()
    }

    await setUserSession(event, {
      user: {
        name: user.username,
        u_id: user.u_id,
        initials: user.initials,
        username: user.username
      },
      loggedInAt: Date.now()
    })

    return ok(event, { ok: true })
  }
  catch (error: any) {
    return problem(event, error?.statusCode || 500, 'Login failed', error?.message || 'Unexpected error')
  }
})
