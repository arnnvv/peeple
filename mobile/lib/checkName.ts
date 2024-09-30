export const nameExists = async (
  name: string,
): Promise<boolean | undefined> => {
  try {
    const response = await fetch(`http://10.61.39.212:3000/check-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name }),
    });

    if (!response.ok)
      throw new Error(`Server responded with status: ${response.status}`);

    const data = await response.json();
    return data.exists;
  } catch (e) {
    console.error(e);
  }
};
