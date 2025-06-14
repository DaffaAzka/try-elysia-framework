import { Elysia } from 'elysia'
import { node } from '@elysiajs/node'
import swagger from '@elysiajs/swagger'


const app = new Elysia({ adapter: node() })
    .use(swagger())
    .get('/', () => "Hello Elysia")
    .listen(3000, ({hostname, port}) => {
        console.log(`🦊 Elysia is running at ${hostname}:${port}`)
    }) 