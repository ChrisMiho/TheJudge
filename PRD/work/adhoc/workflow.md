I built this new graph workflow to address some issues ive been experiencing working on this project, but now that its done, i think there are more changes that i still need to make in order for me to feel comfortable fully embracing this new workflow. 

The main reason for wanting to build the graph, was to improve my workflow within the project. I had started to notice the following observations that led me to exploring a new workflow all together:

Observations:
1. Agent conversations having become increasingly difficult to follow. From technical jargon to nuances about the project that arent presented in a familiar manner, updating and enhancing the project has become incredibly difficult. 

2. Questions asked by agents are becoming so nuanced and at times technical, that I do not grasp the concept of the idea/issue being discussed. This is further amplified when the various decisions scattered within the PRD folder are referrenced, but no context to what the decision is provided. Or the context provided isnt being put in terms that I can easily understand. 

3. Although i love the checkpoint style workflow that i originally had, with skills that had a defined goal, the process of working through that has become clunky. Although it still accomplishes what its created for, i find myself looping refinement and quality check, continual feeding the output of quality check into refinement to fix things. I like this, but my hope is that the new workflow would enable the agent to handle this, due to the rich context that the PRD directory provides to this application.


These all seemed like very straightforward issues to solve for, so my goal of the workflow was to enable me to:

1. Take a step back from the nuance of the details of implementation, and focus on larger big picture and final functionality working as intended.
2. Enable me to queue up multiple features even, that the workflow could run through overnight, allowing me to spend time during the day to create/refine ideas, and then run overnight for implementation while i sleep.
3. Leverage MCP tools and new methodologies within the workflow to help with create/debugging/triaging issues.
4. Teach me new things about working with agents.

Now that the graph has been finished however, and there has been an enormous amount of refinement gone into it. I realized today that I was still not happy with how it was setup. The initial implementation did a great job of working within the manual workflow that I had already created, but the documentation that supports that system has now become my new focus thatd id love to address

I love the idea that the agents will update/promote changes to the product direction and features ive documented, but what i failed to account for was the continually growing list of decisions that exist within all the files. And while the files have been broken down and organized, as i continue to speed up my pipleine for building, a new issue arises, how do i keep this list from getting out of control? 

When i had this realization, i came to the idea, that the documents themselves would need a refactor. To move away from ideas and the list of decisions, to more of a spec that would be continually updated as changes are made, but would remove the growing list of decisions. The spec + supporting documents should be able to give the agent what it needs to understand the goal and idea behind what the UI and UX should be like, in addition to providing insight into where the data is coming from, how its being leverage, and the significance of it within the user flow. I say this because magic the gathering is a very nuanced game.

Since we are building a suite of features, it almost felt like each user flow/feature was worthy of its own spec/prd + supporting documents. I was thinking potentially a directory per feature, with another directory existing to host information about the data being leveraged potentially? as both the UI components and the backend flow are being re-used for the question user flows. i dont want to have to duplicate documentation about data, when that can be leveraged in multiple places.

Overall, i want to find a strategy that is Agent friendly, but still holds some level of organization that allows me to navigate it with ease without the assistance of an agent. Im sure there is a happy balance to this strategy.

ontop of this, im also seeing new issues with the new graph profile that was setup, and while i am happy with the restrictions being applied, they still need to be tuned for a fully autonomous run.

the "whatIsGraph" directory contains documents that we can leverage to give us a north star for how a workflow /graph should really be setup. 

Lastly, i need a document for how to properly use this workflow, and i almost feel like im missing a skill or i need guidance on what skill to use, for kicking off fresh ideas, creating the starting context for what im trying to do is still confusing to me, and i think the workflow is setup to guide me through it, but i need further clarification for how i should approach bringing a new idea to the project, whether thats a new feature or a newly found bug, in addition to how to properly setup an overnight run

If there is anything that can be baked into the overnight run to further help keep things running smoothly, id love to explore those guardrails as well.