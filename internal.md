# States

* __0__ - Reset - Outside of rules
* __1__ - RuleStart - Start of a selector
* __2__ - RuleReset - After the open-braces
* __3__ - PropStart - Start of a property.
* __4__ - ValueReset - After the colon in a property.
* __5__ - ValueStart - Start of a property value.
* __6__ - ValueEnd - End of a property value, the semicolon.