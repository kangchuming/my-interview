export async function getToken(appid: string, accessKey: string) {
    const result = await fetch('/api/sts/token', {
      method: 'POST',
      headers: {
        Authorization: `Bearer; ${accessKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        appid,
        accessKey
      }),
    })
      .then(res => res.json())
      .then(res => res.jwt_token);
    return result;
  }