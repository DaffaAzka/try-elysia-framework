import { Elysia, status, t } from 'elysia'
import { node } from '@elysiajs/node'
import swagger from '@elysiajs/swagger'

import {note} from './note'



const app = new Elysia({ adapter: node() })
    .use(swagger())
    .use(note)
    .get('/', () => "Hello Elysia")
    .listen(3000, ({hostname, port}) => {
        console.log(`🦊 Elysia is running at ${hostname}:${port}`)
    }) 