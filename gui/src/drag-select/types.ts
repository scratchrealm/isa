import { isNumber } from "@figurl/core-utils"

export type Vec2 = number[]
export const isVec2 = (x: any): x is Vec2 => {
    if ((x) && (Array.isArray(x)) && (x.length === 2)) {
        for (let a of x) {
            if (!isNumber(a)) return false
        }
        return true
    }
    else return false
}

export type Vec3 = number[]
export const isVec3 = (x: any): x is Vec3 => {
    if ((x) && (Array.isArray(x)) && (x.length === 3)) {
        for (let a of x) {
            if (!isNumber(a)) return false
        }
        return true
    }
    else return false
}

export type Vec4 = number[]
export const isVec4 = (x: any): x is Vec4 => {
    if ((x) && (Array.isArray(x)) && (x.length === 4)) {
        for (let a of x) {
            if (!isNumber(a)) return false
        }
        return true
    }
    else return false
}
