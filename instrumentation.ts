export function register() {}

export const onRequestError = async (err: Error) => {
  console.error("Request error:", err)
}
