const { SendMailClient } = require("zeptomail");
const fs = require('fs');
require('dotenv').config();

class MailTemple {
    constructor(to) {
        this.to = to;
        this.client = new SendMailClient({
            url: process.env.ZEPTOMAIL_URL,
            token: process.env.ZEPTOMAIL_TOKEN
        });
    }

    to(to) {
        this.to = to;
        return this;
    }

    who(name) {
        this.name = name;
        return this;
    }

    btnText(text) {
        this.btnText = text;
        return this;
    }

    btnUrl(url) {
        this.btnUrl = url;
        return this;
    }

    subject(sub) {
        this.subject = sub;
        return this;
    }

    body(body) {
        this.body = body;
        return this;
    }

    async send() {
        //compute email sending template here...
        const rd = fs.readFileSync(__dirname + '/template/template.mt');
        const rawTmpl = rd.toString('utf-8');
        const compile = render(rawTmpl, {body: this.body, name: this.name, btnText: this.btnText, btnUrl: this.btnUrl});
        return await this.sendWithZeptoMail(compile, this.to, this.subject);
    }

    async sendWithZeptoMail(html, to, subject) {
        try {
            const response = await this.client.sendMail({
                "from": {
                    "address": process.env.ZEPTOMAIL_FROM_ADDRESS,
                    "name": process.env.ZEPTOMAIL_FROM_NAME
                },
                "to": [
                    {
                        "email_address": {
                            "address": to,
                            "name": this.name || ""
                        }
                    }
                ],
                "subject": subject,
                "htmlbody": html,
            });
            
            return response;
        } catch (error) {
            console.error('ZeptoMail Error:', error);
            throw error;
        }
    }
}

let render = (template, data) => {
    return template.replace(/{{(.*?)}}/g, (match) => {
        let mkd = match.split(/{{|}}/).filter(Boolean)[0];
        let a = data[mkd];
        if (a instanceof Array)
            return a.join('\n');
        return data[mkd];
    })
}

module.exports = MailTemple;