export type ShaderSrc = {
    name: string
    src: string
    width: string
    height: string
    parameters: ShaderParameter[]
}

export type ShaderParameter = SliderParameter | RadioParameter

export type SliderParameter = {
    type: "slider"
    name: string
    uniform: string
    defaultValue: number
}

export type RadioParameter = {
    type: "radio"
    name: string
    description?: string
    defaultValue: string // default selected uniform
    uniform: string
    options: {
        name: string
        uniform: string
    }[]
}

export type Uniforms = {
    u_time: {
        type: string;
        value: number;
    };
    u_resolution: {
        type: string;
        value: any; // TODO: this is a THREE.Vector2. Be more specific maybe?
    };
    u_mouse: {
        type: string;
        value: any; // TODO: this is a THREE.Vector2. Be more specific maybe?
    };
    [key: string]: {
        type: string;
        value: any;
    };
}