# Waivio Custom JSON Operations

> Auto-generated from Zod schemas. Do not edit manually.
>
> custom_json id: `waivio_operations`

## Operations

### CreateObject

Creates a new Waivio object

**method**: `createObject`

**params**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `permlink` | string | yes | Unique permlink identifier for the object |
| `defaultName` | string | yes | Default display name of the object |
| `creator` | string | yes | Hive account that initiates the creation |
| `objectType` | string | yes | Type classification (e.g. restaurant, book, person) |

---

### UpdateObject

Adds a field to an existing Waivio object

**method**: `updateObject`

**params**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `objectPermlink` | string | yes | Permlink of the target object |
| `name` | string | yes | Field name to add or update |
| `locale` | string | no | Locale code (e.g. en-US) |
| `body` | string | yes | Field value / content body |
| `creator` | string | yes | Hive account that initiates the update |

---

### VoteObjectField

Vote for or against an object field update

**method**: `voteObjectField`

**params**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `objectPermlink` | string | yes | Permlink of the target object |
| `fieldTransactionId` | string | yes | Transaction ID of the field to vote on |
| `weight` | number | yes | Vote weight (-10000 to 10000, like Hive percent) |
