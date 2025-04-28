export const researchTable = new sst.aws.Dynamo("Research", {
    fields: {
        userId: "string",
        researchId: "string",
        researchStatus: "string",
    },
    primaryIndex: {hashKey: "researchId"},
    globalIndexes: {
        UserIdIndex: { hashKey: "userId" },
        StatusIndex: { hashKey: "researchStatus" }
    }
})


export const usersTable = new sst.aws.Dynamo("Users", {
    fields: {
        userId: "string"
    },
    primaryIndex: {hashKey: "userId"},
})

export const userKeysTable = new sst.aws.Dynamo("UserKeys", {
    fields: {
        keyId: "string",
        userId: "string",
        apiKeystatus: "string"
    },
    primaryIndex: {hashKey: "userId"},
    globalIndexes: {
        KeyIdIndex: { hashKey: "keyId" }, 
        StatusIndex: { hashKey: "apiKeystatus" }
    }
})
