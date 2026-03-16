// to check if email id is valid or not

export function emailTest (email) {
    console.log("c",email)
    const regExpEmail = /^([a-zA-Z0-9._%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6})$/;
    return regExpEmail.test(email);
}