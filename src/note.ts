import { Elysia, status, t } from 'elysia'

class Note{
    constructor(public data: string[] = ["Moonhalo"]) {}
}

export const note = new Elysia()
    .decorate('note', new Note())
    .get('/', () => "Hello Elysia")
    .get('/note', ({note}) => note.data)
    .get('/note/:index', ({note, params: {index}}) => {
        return note.data[index] ?? status(404)
    },
    {
        params: t.Object({
            index: t.Number()
        })
    })