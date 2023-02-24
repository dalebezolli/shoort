# Shoort - URL Shortener

> The best url shortener

This is a project for me to better understand the process of developing a web-app from start to finish. At the same time I'm actively developing a better user experience from other equivalent sites.

- [Live website](https://shoort.vercel.app/)

## Features

- Easy to follow process
- Optional custom aliases for links
- QR Code pointing to the url for ease of access

I'm also planning to implement these to improve the project:

- Optional password protection per link
- Save created urls to local storage for later use
- Calculate url visits
- Log in to bind and persist urls

## Developing

To get started with the project you'll need to setup some platforms first.

- Host: Vercel (front end & serverless functions)
- Database: Planetscale
- Spam protection: ReCaptcha
- Log Drain: Axiom

Once you log in in these platforms you need to grab the database url from planetscale, the recaptcha api key and axiom api key and create a `DATABASE_URL`, `RECAPTCHA_SECRET` and `AXIOM_KEY` environment variable for each in Vercel.

Clone the repository and run `npm install`, finally you can start developing with 'vercel dev'.

## Contributing

If you have a great idea or found any kind of bug, feel free to fork the project and create a pull request.

## License

Published under the [MIT License](./LICENCE).