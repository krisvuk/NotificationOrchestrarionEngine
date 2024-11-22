import { Arbitrary, FastCheck, Schema as S } from '@effect/schema'

export const NotificationSchema = S.Struct({
	id: S.String.pipe(S.length(10)),
	sessionId: S.String.pipe(S.length(10)),
	type: S.Literal('motion', 'ding'),
	title: S.String.pipe(S.length(10)),
	description: S.String.pipe(S.length(20))
})

type NotificationSchemaType = typeof NotificationSchema.Type

const NotificationArbitraryType = Arbitrary.make(NotificationSchema)

const sampleNotifications = FastCheck.sample(NotificationArbitraryType, 5)

enum ConditionalMode {
	ALL,
	ANY,
	ONE
}

enum ConditionalOperator {
	GREATER_THAN = ">",
	LESS_THAN = "<",
	EQUAL_TO = "==="
}

enum Action {
	LOG
}

type Condition = {
	notificationField: string
	operator: ConditionalOperator
	operand: number | string | boolean
	mode: ConditionalMode
}

type Rule = {
	// triggers the conditionals to be evaluated
	trigger: typeof NotificationSchema.Type.type
	// conditions must be met for the action to fire
	conditions: Condition[]
	// actions fired if the conditionsl are met
	actions: Action[]
}

class RuleEvaluator {
	private notifications: NotificationSchemaType[] = []
	private rules: Rule[] = []

	public addRule(rule: Rule) {
		this.rules.push(rule)
	}

	public post(notification: NotificationSchemaType) {
		this.notifications.push(notification)
		this.rules.filter(r => r.trigger === notification.type).forEach(r => this.checkConditions(notification, r))
	}

	private checkConditions(notification: NotificationSchemaType, rule: Rule) {
		const check = rule.conditions.every(condition => {
			if (condition.operator === ConditionalOperator.GREATER_THAN) {
				if (this.notifications.every(n => n[condition.notificationField] > condition.operand!)) {
					return true
				}
			}
			if (condition.operator === ConditionalOperator.LESS_THAN) {
				if (this.notifications.every(n => n[condition.notificationField] < condition.operand!)) {
					return true
				}
			}
			if (condition.operator === ConditionalOperator.EQUAL_TO) {
				if (this.notifications.every(n => n[condition.notificationField] === condition.operand)) {
					return true
				}
			}
			return false
		})
		if (check) {
			rule.actions.forEach(a => this.fireAction(notification, a))
		}
	}

	private fireAction(notification: NotificationSchemaType, action: Action) {
		if (action === Action.LOG) {
			console.log(notification)
		}
	}
}

const evaluator = new RuleEvaluator()
const rule: Rule = {
	trigger: 'motion',
	conditions: [
		{
			mode: ConditionalMode.ANY,
			operator: ConditionalOperator.EQUAL_TO,
			operand: "motion",
			notificationField: "type",
		}
	],
	actions: [
		Action.LOG
	]
}
const rule2: Rule = {
	trigger: 'motion',
	conditions: [
		{
			mode: ConditionalMode.ANY,
			operator: ConditionalOperator.EQUAL_TO,
			operand: "ding",
			notificationField: "type",
		}
	],
	actions: [
		Action.LOG
	]
}
evaluator.addRule(rule)
evaluator.addRule(rule2)
sampleNotifications.forEach(a => evaluator.post(a))
