import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ruleId } = await params;
    const ruleData = await request.json();

    // Validate required fields
    if (!ruleData.name || !ruleData.conditions) {
      return NextResponse.json(
        { error: 'Missing required fields: name, conditions' },
        { status: 400 }
      );
    }

    // Update rule with new data
    const updatedRule = {
      ...ruleData,
      id: ruleId,
      updated_at: new Date().toISOString()
    };

    // In a real implementation, this would update in Supabase
    console.log('Updating rule:', updatedRule);

    return NextResponse.json({
      success: true,
      data: updatedRule
    });
  } catch (error) {
    console.error('Error updating rule:', error);
    return NextResponse.json(
      { error: 'Failed to update rule' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: ruleId } = await params;

    // In a real implementation, this would delete from Supabase
    console.log('Deleting rule:', ruleId);

    return NextResponse.json({
      success: true,
      message: 'Rule deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting rule:', error);
    return NextResponse.json(
      { error: 'Failed to delete rule' },
      { status: 500 }
    );
  }
}
