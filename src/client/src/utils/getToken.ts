export async function getToken(appid: string, accessKey: string) {
    const result = await fetch('https://openspeech.bytedance.com/api/v1/sts/token', {
      method: 'POST',
      headers: {
        Authorization: `Bearer; ${accessKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        appid,
        duration: 300,  // 单位秒，默认1小时
      }),
    })
      .then(res => res.json())
      .then(res => res.jwt_token);
    return result;
  }