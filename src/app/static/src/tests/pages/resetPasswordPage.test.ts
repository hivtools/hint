const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.resolve(__dirname, '../../../templates/reset-password.ftl'), 'utf8');

document.documentElement.innerHTML = html.toString();
document.getElementById("app")!!.setAttribute("title", "AppTitle");
document.getElementById("app")!!.setAttribute("token", "faketoken");

import {resetPasswordApp} from "../../app/resetPassword";

describe('reset password page', function () {

    it("passes title to app", () => {
        let c = resetPasswordApp.$options;
        expect(document.body.getElementsByClassName("navbar-header").item(0)!!.textContent!!.trim())
            .toBe("AppTitle");
    });
});
