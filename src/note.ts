import { Update } from './../node_modules/@sinclair/typebox/build/cjs/value/delta/delta.d';
import { Elysia, status, t } from 'elysia'

class Note {
    constructor(public data: string[] = ["Moonhalo"]) {}

    add(note: string): string | any {
        if (note != "") {
            this.data.push(note)
            return note;
        } else {
            return status("Gone")
        }
    }

    update(note: string, index:number): string {
        this.data[index] = note
        return this.data[index]
    }

    delete(index: number): string[] {
        return this.data.splice(index, 1)
    }



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
    .patch('/note/:index', ({
        note, params: {index}, body: {data}
    }) => {
        note.update(data, index)
    },
    {
        body: t.Object({
            data: t.String()
        }),

        params: t.Object({
            index: t.Number()
        })
    })
    .put('/note', ({ note, body: { data } }) => {
        return note.add(data)
    },
    {
        body: t.Object({
            data: t.String()
        })
    })
    .delete('/note/:index', ({note, params: {index}}) => {
        return note.delete(index)
    }, 
    {
        params: t.Object({
            index: t.Number()
        })
    })