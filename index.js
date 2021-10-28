const api = require("./service");

let formattedAccounts = [];
const promiseArray = []

async function getRefreshToken(user, password, clientId, secret) {
  return (
    await api.post(
      "/login",
      {
        user,
        password,
      },
      {
        headers: {
          Authorization: `Basic ${btoa(`${clientId}:${secret}`)}`,
        },
      }
    )
  ).data.refresh_token;
}

async function getAccessToken(refreshToken) {
  return (
    await api.post(
      "/token",
      `grant_type=refresh_token&refresh_token=${refreshToken}`,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    )
  ).data.access_token;
}

async function getAccount(accessToken) {
    return (await api.get("/accounts", {
      headers: { Authorization: `Bearer ${accessToken}` },
    })).data.account;
}

getRefreshToken("BankinUser", "12345678", "BankinClientId", "secret").then(
  (refreshToken) => {
    getAccessToken(refreshToken).then((accessToken) => {
      getAccount(accessToken).then((account) => {
        for (const a of account) {
          promiseArray.push(
            api.get(`/accounts/${a.acc_number}/transactions`, {
              headers: { Authorization: `Bearer ${accessToken}` },
            })
          );
        }
        Promise.all(promiseArray).then((result) => {
            for (let index = 0; index < result.length; index++) {
            const { transactions } = result[index].data;

            formattedAccounts.push({
              acc_number: account[index].acc_number,
              amount: account[index].amount,
              transactions: transactions.map((t) => {
                return {
                  label: t.label,
                  amount: t.amount,
                  currency: t.currency,
                };
              }),
            });
          }
          console.log(formattedAccounts)
        });
      })
    });
  }
);
