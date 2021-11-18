const EMAILS = ["johnsmith@outlook.com", "mary@gmail.com", "djacobs@move.org"];

export async function fetchUserName(name) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(EMAILS.indexOf(name) > -1), 200);
  });
}