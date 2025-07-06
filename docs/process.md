# Developement process

Project is split in several development phases (stages).
Each project's phase has an incremental building plan containing several steps.
Each step has several tasks.

## Development phase

### Specificiations

On each new development phase:
- In `build-log` dir, create and fill `stageX.md` file, inspired from provided `template.md` file.
- Once ready, start incremental building plan.

1st pass: Draft, brainstormin, document scafoldding
`aim`: clarify subject, have an overview of all subjects involved
Brainstorm sessions to put all ideas, questions, make decisions 

**technical choices**
 made to keep things simpler for now
***ex: use R3F InstancedPoint instead of custom GPU shdaer implementation*** 

**scope clarification**
which things to put aside for later implementtion
***ex: we will not automatically fetch LIDAR data but get them imported manually by user to keep things simpler for now and avoid handling advanced topic***

***draft cleanup***
- removing unrelevant, banal, common sense, non essential things 
- select only topics you think they are important to mention in final document

**remaining questions**
list any remaining questions that requires more time to reflect on
***ex: should we have two separate components for loading and parsing LAZ file or just one***

2nd pass: Final document
After drafting session, you have better idea of how things will be done,

Start with very direct approach like
- user import a LAZ file 
- LAZ file is parsed
- LAZ file data are visualized as PointCloud

take previous scaffold, 
### Implementation

Follow incremental building plan containing several steps/tasks to be completed in order.

At the end, test, list and address any remaining
- bugs, 
- regressions,
- performance issues
- things requiring improvement

Once done before moving to next stage, update project docs (architectural changes, status, screenshots)