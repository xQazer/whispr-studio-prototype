import React from 'react';
import styled from 'styled-components';

import { Pane, Text, Table, Heading, Button, Icon, IconButton, SegmentedControl, SideSheet, Paragraph, Dialog, TextInput, TextInputField, SelectMenu, Select, Popover, Position, Menu} from 'evergreen-ui';
import {DragProvider, useDragState, getSelectedItems} from '../DragSelectable/Providers/DragProvider';
import { TitledTag } from '../DragSelectableTags';
import DragSelectable from '../DragSelectable/DragSelectableContainer';
import DragItem from '../DragSelectable/DragItem';
import SelectableContainer from '../DragSelectable/SelectableContainer';
import { PaneHighlight, ViewHeader as FlexPad, ScrollList, TagContainer } from './Styles';

const SitesGroupHeader = styled.div`
display: flex;
padding: 16px;
justify-content: space-between;
`

const Flex = styled.div`
display: flex;
`

const SegmentedButtons = styled.div`
display: flex;

& > * {
  padding: 0 12px;
  border-radius: 0
}

& > *:first-child {
  border-top-left-radius: 3px;
  border-bottom-left-radius: 3px;
}

& > *:last-child {
  border-top-right-radius: 3px;
  border-bottom-right-radius: 3px;
}
`

const UnassignedView = ({setAssignWorkers, setShowSiteDetails}) => {

  const dragState = useDragState();

  const [displayStyle, setDisplayStyle] = React.useState('grouped'); // grouped, list
  const [sites,siteDispatch] = React.useReducer(siteReducer, genSites(32));
  const [isHighlighted, setHighlighted] = React.useState(false);

  const assignSelectedToWorker = () => {

    const items = getSelectedItems(dragState).map(({ node }) => node.props);

    const done = () => {
      siteDispatch({type:'REMOVE', payload: items});
    }

    setAssignWorkers({ items, done });
  }

  const draggableProps = React.useMemo(() => {

    const onAdd = (added, done) => {
      siteDispatch({ type: 'ADD', payload: added });
      done();
    }

    const onRemove = removed => {
      siteDispatch({ type: 'REMOVE', payload: removed });
    }

    const onHighlightChange = highlighted => {
      setHighlighted(highlighted);
    }

    return { onAdd, onRemove, onHighlightChange };
  }, []);


  const selectedCount = dragState.selected.length;

  return (
    <PaneHighlight height='100%' flex='0 0 33.33%' background='white' elevation={1} isHighlighted={isHighlighted}>
      <FlexPad>
        <Pane>
          <Heading>Unassigned</Heading>
          <Text>{sites.length} rooms remaining</Text>
        </Pane>
        <Pane flex={1} />
        <Pane display='flex'>
          <SegmentedButtons>
            <Button appearance={displayStyle === 'grouped' ? 'primary' : 'default'} onClick={() => setDisplayStyle('grouped')}>
              <Icon color={displayStyle === 'grouped' ? '#fff' : 'currentColor'} icon='grid-view' />
            </Button>
            <Button appearance={displayStyle === 'list' ? 'primary' : 'default'} onClick={() => setDisplayStyle('list')}>
              <Icon color={displayStyle === 'list' ? '#fff' : 'currentColor'} icon='list' />
            </Button>
          </SegmentedButtons>
          <IconButton marginX={4} icon='more'></IconButton>
        </Pane>
      </FlexPad>

      <ScrollList px={selectedCount > 0 ? 128 : 64}>
        {displayStyle === 'grouped' &&
          [
            <SitesGroupView
            label='First Floor'
            setShowSiteDetails={setShowSiteDetails}
            items={sites.filter(e => e.group === 0)}
            draggableProps={draggableProps}
            />,
            <SitesGroupView
            label='Secound Floor'
            setShowSiteDetails={setShowSiteDetails}
            items={sites.filter(e => e.group === 1)}
            draggableProps={draggableProps}
            />
          ]
        }
        {displayStyle === 'list' &&
          <SitesList
          setShowSiteDetails={setShowSiteDetails}
          items={sites}
          draggableProps={draggableProps}
          />
        }
      </ScrollList>
      {selectedCount > 0 && <FlexPad>
        <div>
          <Heading>{selectedCount} room selected</Heading>
          <Text>-h -m</Text>
        </div>
        <Pane flex={1} />
        <Button onClick={assignSelectedToWorker} iconBefore='new-person'>Assign worker</Button>
      </FlexPad>}
    </PaneHighlight>
  )
}

const SitesGroupView = ({label, items, draggableProps, setShowSiteDetails, ...props }) => {

  return (
    <>
      <SitesGroupHeader>
        <Flex>
          <Icon marginRight={8} icon='chevron-down' />
          <Heading size={400}>{label}</Heading>
        </Flex>
        <Text>{items.length} room{items.length !== 1 ? 's' : ''}</Text>
      </SitesGroupHeader>
      <DragSelectable {...draggableProps} styledRoot={TagContainer}>
          {items.map(props => {
            const { id, title, subtitle, group } = props;
            return <TitledTag onDoubleClick={() => setShowSiteDetails(props)} key={id} id={id} title={title} subtitle={subtitle} group={group} icon='label' />
          })}
      </DragSelectable>
    </>
  )
}

const SitesList = ({ setShowSiteDetails, items, draggableProps }) => {
  const containerRef = React.useRef();
  return (
    <SelectableContainer ref={containerRef} {...draggableProps}>
      <Table>
        <Table.Head>
          <Table.TextHeaderCell>Room</Table.TextHeaderCell>
          <Table.TextHeaderCell>Time</Table.TextHeaderCell>
          <Table.TextHeaderCell>Note</Table.TextHeaderCell>
        </Table.Head>
        <Table.Body>
          {items.map(props => {
            const { id, title, subtitle, group } = props;
            return (
              <Table.Row marginY={8} key={id}>
                <Table.TextCell>
                  <DragItem id={id} containerRef={containerRef}>
                    <TitledTag onDoubleClick={() => setShowSiteDetails(props)} key={id} id={id} title={title} subtitle={subtitle} group={group} icon='label' />
                  </DragItem>
                </Table.TextCell>
                <Table.TextCell>-m</Table.TextCell>
                <Table.TextCell>Note...</Table.TextCell>
              </Table.Row>
            )
          })}
        </Table.Body>

      </Table>
    </SelectableContainer>
  )
}

const genSites = count => {
  return Array(count).fill(1).map((_, i)=> {
    const floorCount = 2;
    
    const floor = i % floorCount;
    const num = Math.floor(i / floorCount);

    const types = ['Stayover'];
    const type = types[Math.floor(Math.random() * types.length)];

    return {id: i, title:`${floor + 1}${num < 10 ? `0${num}` : num}`, subtitle: type, group: floor};
  })
}

const siteReducer = (state, action) => {
  const {type, payload} = action;
  switch(type){
    case 'ADD':
      return [...state, ...payload.map(({id, title, subtitle, group}) => {
        return {id, title, subtitle, group};
      })];

    case 'REMOVE':
      return state.filter(e => !payload.some(x => x.id === e.id));
      
    default:
      throw new Error();
  }
}

export default UnassignedView;